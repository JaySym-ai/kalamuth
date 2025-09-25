import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import type { CombatQueueEntry } from "@/types/combat";

export const runtime = "nodejs";

/**
 * GET /api/arena/queue?arenaSlug=halicara-training-grounds&serverId=alpha-1
 * Fetch current queue for a specific arena on a server
 */
export async function GET(req: Request) {
  const supabase = createClient(await cookies());
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const arenaSlug = url.searchParams.get("arenaSlug");
  const serverId = url.searchParams.get("serverId");

  if (!arenaSlug || !serverId) {
    return NextResponse.json(
      { error: "Missing arenaSlug or serverId" },
      { status: 400 }
    );
  }

  try {
    // Fetch all waiting queue entries for this arena/server
    const { data: queueEntries, error } = await supabase
      .from("combat_queue")
      .select("*")
      .eq("arenaSlug", arenaSlug)
      .eq("serverId", serverId)
      .eq("status", "waiting")
      .order("queuedAt", { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      queue: queueEntries as CombatQueueEntry[],
      count: queueEntries?.length || 0,
    });
  } catch (error) {
    console.error("Error fetching queue:", error);
    return NextResponse.json(
      { error: "Failed to fetch queue" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/arena/queue
 * Join the queue for a specific arena
 * Body: { arenaSlug: string, serverId: string, gladiatorId: string }
 */
export async function POST(req: Request) {
  const supabase = createClient(await cookies());
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { arenaSlug, serverId, gladiatorId } = body;

    if (!arenaSlug || !serverId || !gladiatorId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify gladiator exists and belongs to user
    const { data: gladiator, error: gladError } = await supabase
      .from("gladiators")
      .select("id, ludusId, userId, serverId, rankingPoints, alive, injury, sickness")
      .eq("id", gladiatorId)
      .eq("userId", user.id)
      .maybeSingle();

    if (gladError || !gladiator) {
      return NextResponse.json(
        { error: "Gladiator not found or not owned by user" },
        { status: 404 }
      );
    }

    // Verify gladiator is on the same server
    if (gladiator.serverId !== serverId) {
      return NextResponse.json(
        { error: "Gladiator is not on this server" },
        { status: 400 }
      );
    }

    // Verify gladiator is alive and healthy enough to fight
    if (!gladiator.alive) {
      return NextResponse.json(
        { error: "Gladiator is not alive" },
        { status: 400 }
      );
    }

    if (gladiator.injury || gladiator.sickness) {
      return NextResponse.json(
        { error: "Gladiator is injured or sick" },
        { status: 400 }
      );
    }

    // Check if gladiator is already in any queue
    const { data: existingQueue } = await supabase
      .from("combat_queue")
      .select("id")
      .eq("gladiatorId", gladiatorId)
      .eq("status", "waiting")
      .maybeSingle();

    if (existingQueue) {
      return NextResponse.json(
        { error: "Gladiator is already in queue" },
        { status: 400 }
      );
    }

    // Add to queue
    const { data: queueEntry, error: queueError } = await supabase
      .from("combat_queue")
      .insert({
        arenaSlug,
        serverId,
        gladiatorId,
        ludusId: gladiator.ludusId,
        userId: user.id,
        rankingPoints: gladiator.rankingPoints || 1000,
        status: "waiting",
      })
      .select("*")
      .single();

    if (queueError) throw queueError;

    // After adding to queue, attempt matchmaking
    await attemptMatchmaking(supabase, arenaSlug, serverId);

    return NextResponse.json({
      success: true,
      queueEntry: queueEntry as CombatQueueEntry,
    });
  } catch (error) {
    console.error("Error joining queue:", error);
    return NextResponse.json(
      { error: "Failed to join queue" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/arena/queue?queueId=xxx
 * Leave the queue
 */
export async function DELETE(req: Request) {
  const supabase = createClient(await cookies());
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const queueId = url.searchParams.get("queueId");

  if (!queueId) {
    return NextResponse.json(
      { error: "Missing queueId" },
      { status: 400 }
    );
  }

  try {
    // Verify ownership and delete
    const { error } = await supabase
      .from("combat_queue")
      .delete()
      .eq("id", queueId)
      .eq("userId", user.id)
      .eq("status", "waiting");

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error leaving queue:", error);
    return NextResponse.json(
      { error: "Failed to leave queue" },
      { status: 500 }
    );
  }
}

/**
 * Matchmaking logic: Find two gladiators with similar ranking points
 * and create a match if possible.
 */
async function attemptMatchmaking(
  supabase: ReturnType<typeof createClient>,
  arenaSlug: string,
  serverId: string
) {
  try {
    // Check if there's already an active match for this arena
    const { data: activeMatch } = await supabase
      .from("combat_matches")
      .select("id")
      .eq("arenaSlug", arenaSlug)
      .eq("serverId", serverId)
      .in("status", ["pending", "in_progress"])
      .maybeSingle();

    // Only one match at a time per arena
    if (activeMatch) {
      return;
    }

    // Get all waiting gladiators in queue, ordered by queue time
    const { data: queueEntries } = await supabase
      .from("combat_queue")
      .select("*")
      .eq("arenaSlug", arenaSlug)
      .eq("serverId", serverId)
      .eq("status", "waiting")
      .order("queuedAt", { ascending: true });

    if (!queueEntries || queueEntries.length < 2) {
      return; // Need at least 2 gladiators to match
    }

    // Simple matchmaking: take the first two gladiators with closest ranking
    // Sort by ranking points to find best matches
    const sorted = [...queueEntries].sort((a, b) => a.rankingPoints - b.rankingPoints);
    
    // Find the pair with smallest ranking difference
    let bestPair: [typeof sorted[0], typeof sorted[0]] | null = null;
    let smallestDiff = Infinity;

    for (let i = 0; i < sorted.length - 1; i++) {
      const diff = Math.abs(sorted[i].rankingPoints - sorted[i + 1].rankingPoints);
      if (diff < smallestDiff) {
        smallestDiff = diff;
        bestPair = [sorted[i], sorted[i + 1]];
      }
    }

    if (!bestPair) return;

    const [entry1, entry2] = bestPair;

    // Create the match
    const { data: match, error: matchError } = await supabase
      .from("combat_matches")
      .insert({
        arenaSlug,
        serverId,
        gladiator1Id: entry1.gladiatorId,
        gladiator2Id: entry2.gladiatorId,
        status: "pending",
      })
      .select("id")
      .single();

    if (matchError) {
      console.error("Error creating match:", matchError);
      return;
    }

    // Update queue entries to matched status
    await supabase
      .from("combat_queue")
      .update({ status: "matched", matchId: match.id })
      .in("id", [entry1.id, entry2.id]);

  } catch (error) {
    console.error("Matchmaking error:", error);
  }
}
