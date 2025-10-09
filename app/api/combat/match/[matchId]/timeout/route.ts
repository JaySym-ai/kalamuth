import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

/**
 * POST /api/combat/match/[matchId]/timeout
 * Handle match acceptance timeout (can be called by cron or client)
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {

  
  const { matchId } = await params;
  if (!matchId) {
    return NextResponse.json({ error: "missing matchId" }, { status: 400 });
  }

  try {
    // Use service role for system operations
    const serviceRole = createServiceRoleClient();
    
    // Fetch match
    const { data: match, error: matchError } = await serviceRole
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
    const { error: updateError } = await serviceRole
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

    // Remove both gladiators from the queue
    // When timeout happens, both players should be removed from queue
    const gladiatorIds = [match.gladiator1Id, match.gladiator2Id];

    const { error: queueDeleteError } = await serviceRole
      .from("combat_queue")
      .delete()
      .in("gladiatorId", gladiatorIds)
      .eq("matchId", matchId);

    if (queueDeleteError) {
      console.error("Error removing gladiators from queue:", queueDeleteError);
    }

    // Get acceptance records for logging
    const { data: acceptances, error: acceptanceError } = await serviceRole
      .from("combat_match_acceptances")
      .select("*")
      .eq("matchId", matchId);

    if (acceptanceError) {
      console.error("Error fetching acceptances:", acceptanceError);
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