import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient, createServiceRoleClient } from "@/utils/supabase/server";
import { debug_error } from "@/utils/debug";

export const runtime = "nodejs";

/**
 * POST /api/combat/match/[matchId]/decline
 * Decline a combat match request
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const supabase = createClient(await cookies());
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { matchId } = await params;
  if (!matchId) {
    return NextResponse.json({ error: "missing matchId" }, { status: 400 });
  }

  try {
    // Use service role client to bypass RLS temporarily
    const serviceRole = createServiceRoleClient();

    // Fetch match and verify user is a participant
    const { data: match, error: matchError } = await serviceRole
      .from("combat_matches")
      .select("*")
      .eq("id", matchId)
      .eq("status", "pending_acceptance")
      .maybeSingle();

    if (matchError || !match) {
      return NextResponse.json({ error: "match_not_found" }, { status: 404 });
    }

    // Verify user owns one of the gladiators
    const { data: participant, error: participantError } = await serviceRole
      .from("gladiators")
      .select("id")
      .in("id", [match.gladiator1Id, match.gladiator2Id])
      .eq("userId", user.id)
      .maybeSingle();

    if (participantError || !participant) {
      return NextResponse.json({ error: "not_participant" }, { status: 403 });
    }

    // Cancel the match since one player declined
    const { error: updateError } = await serviceRole
      .from("combat_matches")
      .update({
        status: "cancelled",
        acceptanceDeadline: null // Clear the deadline
      })
      .eq("id", matchId);

    if (updateError) {
      debug_error("Error cancelling match:", updateError);
      return NextResponse.json({ error: "failed_to_cancel_match" }, { status: 500 });
    }

    // Delete all acceptance records for this cancelled match
    const { error: acceptanceDeleteError } = await serviceRole
      .from("combat_match_acceptances")
      .delete()
      .eq("matchId", matchId);

    if (acceptanceDeleteError) {
      debug_error("Error deleting acceptances:", acceptanceDeleteError);
    }

    // Remove the other gladiator from the queue if they're still there
    const { data: otherGladiatorId } = await serviceRole
      .from("gladiators")
      .select("id")
      .in("id", [match.gladiator1Id, match.gladiator2Id])
      .neq("id", participant.id)
      .single();

    if (otherGladiatorId) {
      await serviceRole
        .from("combat_queue")
        .update({ status: "cancelled" })
        .eq("gladiatorId", otherGladiatorId)
        .eq("status", "matched");
    }

    return NextResponse.json({
      success: true,
      matchCancelled: true,
    });
  } catch (error) {
    debug_error("Error declining match:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}