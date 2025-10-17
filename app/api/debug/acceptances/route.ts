import { NextResponse } from "next/server";
import { requireAuthAPI } from "@/lib/auth/server";
import { badRequestResponse, handleAPIError } from "@/lib/api/errors";
import { debug_error } from "@/utils/debug";

export const runtime = "nodejs";

/**
 * GET /api/debug/acceptances?matchId=xxx
 * Debug endpoint to check acceptances for a match
 */
export async function GET(req: Request) {
  try {
    const { user, supabase } = await requireAuthAPI();

    const url = new URL(req.url);
    const matchId = url.searchParams.get("matchId");

    if (!matchId) {
      return badRequestResponse("missing_matchId");
    }

    // Fetch acceptances
    const { data: acceptances, error: acceptanceError } = await supabase
      .from("combat_match_acceptances")
      .select("*")
      .eq("matchId", matchId);

    if (acceptanceError) {
      debug_error("Error fetching acceptances:", acceptanceError);
      throw new Error(`Failed to fetch acceptances: ${acceptanceError.message}`);
    }

    // Fetch match
    const { data: match } = await supabase
      .from("combat_matches")
      .select("*")
      .eq("id", matchId)
      .maybeSingle();

    return NextResponse.json({
      matchId,
      match,
      acceptances,
      acceptancesCount: acceptances?.length || 0,
      userId: user.id,
    });
  } catch (error) {
    debug_error("Debug acceptances error:", error);
    return handleAPIError(error, "Debug acceptances");
  }
}

