import { NextResponse } from "next/server";
import { requireAuthAPI } from "@/lib/auth/server";
import { createServiceRoleClient } from "@/utils/supabase/server";
import type { CombatMatchAcceptance } from "@/types/combat";
import { debug_error } from "@/utils/debug";

export const runtime = "nodejs";

/**
 * GET /api/combat/match/[matchId]/acceptances
 * Fetch all acceptances for a specific match
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { supabase } = await requireAuthAPI();

  const { matchId } = await params;

  if (!matchId) {
    return NextResponse.json(
      { error: "Missing matchId" },
      { status: 400 }
    );
  }

  try {
    // Use service role client to bypass RLS temporarily
    // This is a workaround until the RLS recursion is fixed
    const serviceRole = createServiceRoleClient();

    // First verify the user is part of this match using service role
    const { data: match, error: matchError } = await serviceRole
      .from("combat_matches")
      .select("gladiator1Id, gladiator2Id")
      .eq("id", matchId)
      .single();

    if (matchError || !match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    // Check if user owns either gladiator
    const { data: userGladiators } = await serviceRole
      .from("gladiators")
      .select("id")
      .eq("userId", user.id)
      .in("id", [match.gladiator1Id, match.gladiator2Id]);

    if (!userGladiators || userGladiators.length === 0) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Fetch all acceptances for this match using service role
    const { data: acceptances, error } = await serviceRole
      .from("combat_match_acceptances")
      .select("*")
      .eq("matchId", matchId)
      .order("createdAt", { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      acceptances: acceptances as CombatMatchAcceptance[],
      count: acceptances?.length || 0,
    });
  } catch (error) {
    debug_error("Error fetching acceptances:", error);
    return NextResponse.json(
      { error: "Failed to fetch acceptances" },
      { status: 500 }
    );
  }
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    debug_error("Acceptances fetch error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}