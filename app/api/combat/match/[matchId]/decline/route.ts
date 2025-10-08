import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import type { CombatMatchAcceptance } from "@/types/combat";

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
    // Fetch match and verify user is a participant
    const { data: match, error: matchError } = await supabase
      .from("combat_matches")
      .select("*")
      .eq("id", matchId)
      .eq("status", "pending_acceptance")
      .maybeSingle();

    if (matchError || !match) {
      return NextResponse.json({ error: "match_not_found" }, { status: 404 });
    }

    // Verify user owns one of the gladiators
    const { data: participant, error: participantError } = await supabase
      .from("gladiators")
      .select("id")
      .in("id", [match.gladiator1Id, match.gladiator2Id])
      .eq("userId", user.id)
      .maybeSingle();

    if (participantError || !participant) {
      return NextResponse.json({ error: "not_participant" }, { status: 403 });
    }

    // Update the existing acceptance record
    const { data: acceptance, error: acceptanceError } = await supabase
      .from("combat_match_acceptances")
      .update({
        status: "declined",
        respondedAt: new Date().toISOString(),
      })
      .eq("matchId", matchId)
      .eq("gladiatorId", participant.id)
      .select("*")
      .single();

    if (acceptanceError) {
      console.error("Error updating acceptance:", acceptanceError);
      return NextResponse.json({ error: "failed_to_decline" }, { status: 500 });
    }

    // Cancel the match since one player declined
    const { error: updateError } = await supabase
      .from("combat_matches")
      .update({ 
        status: "cancelled",
        acceptanceDeadline: null // Clear the deadline
      })
      .eq("id", matchId);

    if (updateError) {
      console.error("Error cancelling match:", updateError);
      return NextResponse.json({ error: "failed_to_cancel_match" }, { status: 500 });
    }

    // Remove the other gladiator from the queue if they're still there
    const { data: otherGladiatorId } = await supabase
      .from("gladiators")
      .select("id")
      .in("id", [match.gladiator1Id, match.gladiator2Id])
      .neq("id", participant.id)
      .single();

    if (otherGladiatorId) {
      await supabase
        .from("combat_queue")
        .update({ status: "cancelled" })
        .eq("gladiatorId", otherGladiatorId)
        .eq("status", "matched");
    }

    return NextResponse.json({
      success: true,
      acceptance: acceptance as CombatMatchAcceptance,
      matchCancelled: true,
    });
  } catch (error) {
    console.error("Error declining match:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}