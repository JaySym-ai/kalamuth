import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { debug_error } from "@/utils/debug";

export const runtime = "nodejs";

/**
 * GET /api/debug/matchmaking-fix
 * Debug endpoint to verify the matchmaking fix is working
 */
export async function GET() {
  const supabase = createClient(await cookies());
  
  try {
    // Check if realtime is enabled for combat_match_acceptances
    const { error: realtimeError } = await supabase
      .rpc('get_realtime_tables');
    
    // Check recent matches and their acceptances
    const { data: recentMatches, error: matchesError } = await supabase
      .from("combat_matches")
      .select(`
        id,
        status,
        acceptanceDeadline,
        matchedAt,
        combat_match_acceptances (
          id,
          gladiatorId,
          userId,
          status,
          createdAt,
          respondedAt
        )
      `)
      .eq("status", "pending_acceptance")
      .order("matchedAt", { ascending: false })
      .limit(5);

    return NextResponse.json({
      success: true,
      realtimeEnabled: !realtimeError,
      recentMatches: recentMatches || [],
      errors: {
        realtime: realtimeError?.message,
        matches: matchesError?.message,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    debug_error("Debug endpoint error:", error);
    return NextResponse.json(
      { error: "Debug endpoint failed", details: error },
      { status: 500 }
    );
  }
}