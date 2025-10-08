import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

/**
 * POST /api/combat/match/[matchId]/timeout
 * Handle match acceptance timeout (can be called by cron or client)
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const supabase = createClient(await cookies());
  
  const { matchId } = await params;
  if (!matchId) {
    return NextResponse.json({ error: "missing matchId" }, { status: 400 });
  }

  try {
    // Fetch match
    const { data: match, error: matchError } = await supabase
      .from("combat_matches")
      .select("*")
      .eq("id", matchId)
      .eq("status", "pending_acceptance")
      .maybeSingle();

    if (matchError || !match) {
      return NextResponse.json({ error: "match_not_found" }, { status: 404 });
    }

    // Check if deadline has passed
    const now = new Date();
    const deadline = match.acceptanceDeadline ? new Date(match.acceptanceDeadline) : null;
    
    if (!deadline || now <= deadline) {
      return NextResponse.json({ error: "timeout_not_reached" }, { status: 400 });
    }

    // Cancel the match
    const { error: updateError } = await supabase
      .from("combat_matches")
      .update({ 
        status: "cancelled",
        acceptanceDeadline: null
      })
      .eq("id", matchId);

    if (updateError) {
      console.error("Error cancelling match:", updateError);
      return NextResponse.json({ error: "failed_to_cancel" }, { status: 500 });
    }

    // Get acceptance records to see who didn't respond
    const { data: acceptances, error: acceptanceError } = await supabase
      .from("combat_match_acceptances")
      .select("*")
      .eq("matchId", matchId);

    if (acceptanceError) {
      console.error("Error fetching acceptances:", acceptanceError);
    }

    // Re-queue gladiators who are still waiting (those who accepted)
    if (acceptances) {
      const acceptedGladiators = acceptances
        .filter(a => a.status === "accepted")
        .map(a => a.gladiatorId);

      if (acceptedGladiators.length > 0) {
        // Find the queue entries for these gladiators
        const { data: queueEntries } = await supabase
          .from("combat_queue")
          .select("*")
          .in("gladiatorId", acceptedGladiators)
          .eq("status", "matched");

        if (queueEntries) {
          // Reset them to waiting status
          await supabase
            .from("combat_queue")
            .update({ 
              status: "waiting",
              matchId: null
            })
            .in("id", queueEntries.map(e => e.id));
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Match cancelled due to timeout",
      acceptances: acceptances || [],
    });
  } catch (error) {
    console.error("Error handling timeout:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}