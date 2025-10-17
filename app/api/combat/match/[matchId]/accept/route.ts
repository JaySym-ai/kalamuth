import { NextResponse } from "next/server";
import { requireAuthAPI } from "@/lib/auth/server";
import { createServiceRoleClient } from "@/utils/supabase/server";
import type { CombatMatchAcceptance } from "@/types/combat";
import { debug_error } from "@/utils/debug";

export const runtime = "nodejs";

/**
 * POST /api/combat/match/[matchId]/accept
 * Accept a combat match request
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { user } = await requireAuthAPI();

    const { matchId } = await params;
    if (!matchId) {
      return NextResponse.json({ error: "missing matchId" }, { status: 400 });
    }

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

    // Check if acceptance deadline has passed
    if (match.acceptanceDeadline && new Date() > new Date(match.acceptanceDeadline)) {
      return NextResponse.json({ error: "acceptance_expired" }, { status: 410 });
    }

    // Update the existing acceptance record
    const { data: acceptance, error: acceptanceError } = await serviceRole
      .from("combat_match_acceptances")
      .update({
        status: "accepted",
        respondedAt: new Date().toISOString(),
      })
      .eq("matchId", matchId)
      .eq("gladiatorId", participant.id)
      .select("*")
      .single();

    if (acceptanceError) {
      debug_error("Error updating acceptance:", acceptanceError);
      return NextResponse.json({ error: "failed_to_accept" }, { status: 500 });
    }

    // Check if both players have accepted
    const { data: allAcceptances, error: allAcceptancesError } = await serviceRole
      .from("combat_match_acceptances")
      .select("*")
      .eq("matchId", matchId);

    if (allAcceptancesError) {
      debug_error("Error fetching acceptances:", allAcceptancesError);
      return NextResponse.json({ error: "failed_to_check_status" }, { status: 500 });
    }

    const allAccepted = allAcceptances.every(a => a.status === "accepted");

    // If both accepted, update match status to pending
    if (allAccepted && allAcceptances.length === 2) {
      const { error: updateError } = await serviceRole
        .from("combat_matches")
        .update({
          status: "pending",
          acceptanceDeadline: null // Clear the deadline
        })
        .eq("id", matchId);

      if (updateError) {
        debug_error("Error updating match status:", updateError);
        return NextResponse.json({ error: "failed_to_update_match" }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      acceptance: acceptance as CombatMatchAcceptance,
      bothAccepted: allAccepted && allAcceptances.length === 2,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    debug_error("Error accepting match:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}