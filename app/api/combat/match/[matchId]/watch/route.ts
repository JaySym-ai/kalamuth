import { requireAuthAPI } from "@/lib/auth/server";
import { notFoundResponse, handleAPIError } from "@/lib/api/errors";
import { streamMatchLogs } from "@/lib/combat/streams";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Watch endpoint for spectators to view an ongoing or completed fight
 * Returns existing logs and streams new ones via SSE
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { user, supabase } = await requireAuthAPI();

    const { matchId } = await params;

    // Fetch match
    const { data: match, error: matchError } = await supabase
      .from("combat_matches")
      .select("*")
      .eq("id", matchId)
      .maybeSingle();

    if (matchError || !match) {
      return notFoundResponse("match");
    }

    // Verify user is a participant
    const { data: participantCheck } = await supabase
      .from("gladiators")
      .select("id")
      .in("id", [match.gladiator1Id, match.gladiator2Id])
      .eq("userId", user.id);

    if (!participantCheck || participantCheck.length === 0) {
      return new Response("Forbidden", { status: 403 });
    }

    return streamMatchLogs(matchId);
  } catch (error) {
    return handleAPIError(error, "Combat match watch");
  }
}

