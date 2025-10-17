import { requireAuthAPI } from "@/lib/auth/server";
import { handleAPIError, notFoundResponse, badRequestResponse } from "@/lib/api/errors";
import { NextResponse } from "next/server";
import { debug_error } from "@/utils/debug";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Get the current status of a combat match
 * This endpoint is used by the client to determine whether to use start or watch endpoint
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { user, supabase } = await requireAuthAPI();

  const { matchId } = await params;

  // Fetch match status
  const { data: match, error: matchError } = await supabase
    .from("combat_matches")
    .select("status, winnerId, winnerMethod, gladiator1Id, gladiator2Id")
    .eq("id", matchId)
    .maybeSingle();

  if (matchError || !match) {
    return notFoundResponse("match");
  }

  // Verify user is a participant and check server consistency
  const { data: participantCheck } = await supabase
    .from("gladiators")
    .select("id, serverId")
    .in("id", [match.gladiator1Id, match.gladiator2Id])
    .eq("userId", user.id);

  if (!participantCheck || participantCheck.length === 0) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Verify all participants are from the same server
  const uniqueServers = new Set(participantCheck.map(g => g.serverId));
  if (uniqueServers.size > 1) {
    debug_error("Match contains gladiators from different servers", { matchId, servers: Array.from(uniqueServers) });
    return badRequestResponse("server_mismatch");
  }

  return Response.json({
    status: match.status,
    winnerId: match.winnerId,
    winnerMethod: match.winnerMethod,
  });
  } catch (error) {
    return handleAPIError(error, "Combat match status");
  }
}
