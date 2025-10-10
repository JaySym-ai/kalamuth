import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import type { CombatLogEntry } from "@/types/combat";
import { debug_error } from "@/utils/debug";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Watch endpoint for spectators to view an ongoing or completed fight
 * Returns existing logs and streams new ones via SSE
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { matchId } = await params;

  // Fetch match
  const { data: match, error: matchError } = await supabase
    .from("combat_matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle();

  if (matchError || !match) {
    return new Response("Match not found", { status: 404 });
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

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Helper to send SSE message
        const sendEvent = (data: unknown) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        // Fetch all existing logs for this match
        const { data: existingLogs, error: logsError } = await supabase
          .from("combat_logs")
          .select("*")
          .eq("matchId", matchId)
          .order("actionNumber", { ascending: true });

        if (logsError) {
          throw new Error(`Failed to fetch logs: ${logsError.message}`);
        }

        // Send all existing logs
        if (existingLogs && existingLogs.length > 0) {
          for (const log of existingLogs) {
            const logEntry: CombatLogEntry = {
              id: log.id,
              matchId: log.matchId,
              actionNumber: log.actionNumber,
              message: log.message,
              createdAt: log.createdAt,
              type: log.type,
              locale: log.locale,
              gladiator1Health: log.gladiator1Health,
              gladiator2Health: log.gladiator2Health,
            };
            sendEvent({ type: "log", log: logEntry });
          }
        }

        // If match is already complete, send complete event
        if (match.status === "completed") {
          sendEvent({
            type: "complete",
            winnerId: match.winnerId,
            winnerMethod: match.winnerMethod,
          });
          controller.close();
          return;
        }

        // If match is in progress, poll for new logs
        if (match.status === "in_progress") {
          let lastActionNumber = existingLogs && existingLogs.length > 0
            ? Math.max(...existingLogs.map((log) => log.actionNumber))
            : 0;
          let isComplete = false;

          // Poll for new logs every 1 second
          const pollInterval = setInterval(async () => {
            try {
              // Check if match is complete
              const { data: updatedMatch } = await supabase
                .from("combat_matches")
                .select("status, winnerId, winnerMethod")
                .eq("id", matchId)
                .maybeSingle();

              if (updatedMatch?.status === "completed" && !isComplete) {
                isComplete = true;
                sendEvent({
                  type: "complete",
                  winnerId: updatedMatch.winnerId,
                  winnerMethod: updatedMatch.winnerMethod,
                });
                clearInterval(pollInterval);
                controller.close();
                return;
              }

              // Fetch new logs since last action
              const { data: newLogs } = await supabase
                .from("combat_logs")
                .select("*")
                .eq("matchId", matchId)
                .gt("actionNumber", lastActionNumber)
                .order("actionNumber", { ascending: true });

              if (newLogs && newLogs.length > 0) {
                for (const log of newLogs) {
                  const logEntry: CombatLogEntry = {
                    id: log.id,
                    matchId: log.matchId,
                    actionNumber: log.actionNumber,
                    message: log.message,
                    createdAt: log.createdAt,
                    type: log.type,
                    locale: log.locale,
                    gladiator1Health: log.gladiator1Health,
                    gladiator2Health: log.gladiator2Health,
                  };
                  sendEvent({ type: "log", log: logEntry });
                  lastActionNumber = Math.max(lastActionNumber, log.actionNumber);
                }
              }
            } catch (error) {
              debug_error("Poll error:", error);
              clearInterval(pollInterval);
            }
          }, 1000);

          // Handle client disconnect
          const originalClose = controller.close.bind(controller);
          controller.close = () => {
            clearInterval(pollInterval);
            originalClose();
          };
        }
      } catch (error) {
        debug_error("Watch stream error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: errorMessage })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

