import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient, createServiceRoleClient } from "@/utils/supabase/server";
import type { CombatQueueEntry } from "@/types/combat";
import { debug_error } from "@/utils/debug";

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
    debug_error("Error fetching queue:", error);
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

    // Verify gladiator is alive
    if (!gladiator.alive) {
      return NextResponse.json(
        { error: "Gladiator is not alive" },
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
    const serviceRole = createServiceRoleClient();
    await attemptMatchmaking(serviceRole, arenaSlug, serverId);

    return NextResponse.json({
      success: true,
      queueEntry: queueEntry as CombatQueueEntry,
    });
  } catch (error) {
    debug_error("Error joining queue:", error);
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
    debug_error("Error leaving queue:", error);
    return NextResponse.json(
      { error: "Failed to leave queue" },
      { status: 500 }
    );
  }
}

/**
 * Matchmaking logic: Find two gladiators with similar ranking points
 * and create a match that requires mutual acceptance.
 */
async function attemptMatchmaking(
  supabase: ReturnType<typeof createClient>,
  arenaSlug: string,
  serverId: string
) {
  try {
    // Check for existing active or pending acceptance matches
    const { data: activeMatch } = await supabase
      .from("combat_matches")
      .select("id")
      .eq("arenaSlug", arenaSlug)
      .eq("serverId", serverId)
      .in("status", ["pending_acceptance", "pending", "in_progress"])
      .maybeSingle();

    if (activeMatch) {
      return;
    }

    const { data: queueEntries } = await supabase
      .from("combat_queue")
      .select("*")
      .eq("arenaSlug", arenaSlug)
      .eq("serverId", serverId)
      .eq("status", "waiting")
      .order("queuedAt", { ascending: true });

    if (!queueEntries || queueEntries.length < 2) {
      return;
    }

    const ranked = [...queueEntries].sort((a, b) => {
      if (a.rankingPoints === b.rankingPoints) {
        return new Date(a.queuedAt).getTime() - new Date(b.queuedAt).getTime();
      }
      return a.rankingPoints - b.rankingPoints;
    });

    type PairCandidate = {
      entries: [typeof ranked[number], typeof ranked[number]];
      diff: number;
      earliestQueuedAt: number;
    };

    let bestPair: PairCandidate | null = null;

    for (let i = 0; i < ranked.length - 1; i++) {
      for (let j = i + 1; j < ranked.length; j++) {
        const first = ranked[i];
        const second = ranked[j];

        if (first.userId === second.userId) continue;
        if (first.ludusId === second.ludusId) continue;

        const diff = Math.abs(first.rankingPoints - second.rankingPoints);
        const earliestQueuedAt = Math.min(
          new Date(first.queuedAt).getTime(),
          new Date(second.queuedAt).getTime(),
        );

        if (
          !bestPair ||
          diff < bestPair.diff ||
          (diff === bestPair.diff && earliestQueuedAt < bestPair.earliestQueuedAt)
        ) {
          bestPair = {
            entries: [first, second],
            diff,
            earliestQueuedAt,
          };
        }

        if (diff === 0) {
          break;
        }
      }

      if (bestPair?.diff === 0) {
        break;
      }
    }

    if (!bestPair) {
      return;
    }

    const [entry1, entry2] = bestPair.entries;
    const matchedAt = new Date().toISOString();
    const acceptanceDeadline = new Date(Date.now() + 60 * 1000).toISOString(); // 1 minute from now

    // Create match with pending_acceptance status
    // Use service role for system operations
    const serviceRole = createServiceRoleClient();
    const { data: match, error: matchError } = await serviceRole
      .from("combat_matches")
      .insert({
        arenaSlug,
        serverId,
        gladiator1Id: entry1.gladiatorId,
        gladiator2Id: entry2.gladiatorId,
        status: "pending_acceptance",
        matchedAt,
        acceptanceDeadline,
      })
      .select("*")
      .single();

    if (matchError || !match) {
      debug_error("Error creating match:", matchError);
      return;
    }

    // Update queue entries to matched status
    const { error: updateError } = await serviceRole
      .from("combat_queue")
      .update({ status: "matched", matchId: match.id })
      .in("id", [entry1.id, entry2.id])
      .eq("status", "waiting");

    if (updateError) {
      debug_error("Error updating queue status:", updateError);
      await serviceRole.from("combat_matches").delete().eq("id", match.id);
      return;
    }

    // Create acceptance records for both players
    const acceptances = [
      {
        matchId: match.id,
        gladiatorId: entry1.gladiatorId,
        userId: entry1.userId,
        status: "pending",
      },
      {
        matchId: match.id,
        gladiatorId: entry2.gladiatorId,
        userId: entry2.userId,
        status: "pending",
      },
    ];

    // Use service role client to bypass RLS for system-created acceptances
    const { error: acceptanceError } = await serviceRole
      .from("combat_match_acceptances")
      .insert(acceptances);

    if (acceptanceError) {
      debug_error("Error creating acceptances:", acceptanceError);
      // Clean up the match and queue entries using service role
      await serviceRole.from("combat_matches").delete().eq("id", match.id);
      await serviceRole
        .from("combat_queue")
        .update({ status: "waiting", matchId: null })
        .in("id", [entry1.id, entry2.id]);
    }
  } catch (error) {
    debug_error("Matchmaking error:", error);
  }
}
