import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { debug_error } from "@/utils/debug";

export const runtime = "nodejs";

/**
 * GET /api/debug/acceptances?matchId=xxx
 * Debug endpoint to check acceptances for a match
 */
export async function GET(req: Request) {
  const supabase = createClient(await cookies());
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const matchId = url.searchParams.get("matchId");

  if (!matchId) {
    return NextResponse.json({ error: "Missing matchId" }, { status: 400 });
  }

  try {
    // Fetch acceptances
    const { data: acceptances, error: acceptanceError } = await supabase
      .from("combat_match_acceptances")
      .select("*")
      .eq("matchId", matchId);

    if (acceptanceError) {
      debug_error("Error fetching acceptances:", acceptanceError);
      return NextResponse.json({ 
        error: "Failed to fetch acceptances",
        details: acceptanceError 
      }, { status: 500 });
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
    debug_error("Error in debug endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

