import { createServiceRoleClient } from "@/utils/supabase/server";
import type { CombatLogEntry } from "@/types/combat";
import { debug_error } from "@/utils/debug";

/**
 * Shared SSE utility to stream existing logs and live updates for a combat match.
 * - Sends all existing logs in ascending action order
 * - If match is already completed: immediately emits a complete event and closes
 * - If in progress: polls for new logs and completion every second
 * - Sends a keep-alive ping every 30s
 */
export async function streamMatchLogs(matchId: string): Promise<Response> {
  const serviceRole = createServiceRoleClient();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;
      let pollInterval: NodeJS.Timeout | null = null;
      let pingInterval: NodeJS.Timeout | null = null;

      const safeEnqueue = (data: unknown) => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (err) {
          isClosed = true;
          debug_error("Failed to enqueue SSE event (controller likely closed)", err);
        }
      };

      try {
        // Fetch all existing logs (ascending by actionNumber)
        const { data: existingLogs, error: logsError } = await serviceRole
          .from("combat_logs")
          .select("*")
          .eq("matchId", matchId)
          .order("actionNumber", { ascending: true });

        if (logsError) throw new Error(`Failed to fetch logs: ${logsError.message}`);

        if (existingLogs && existingLogs.length > 0) {
          for (const log of existingLogs) {
            const entry: CombatLogEntry = {
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
            safeEnqueue({ type: "log", log: entry });
          }
        }

        // Check current match status
        const { data: match } = await serviceRole
          .from("combat_matches")
          .select("status, winnerId, winnerMethod")
          .eq("id", matchId)
          .maybeSingle();

        // If already completed, emit completion and close
        if (match?.status === "completed") {
          safeEnqueue({
            type: "complete",
            winnerId: match.winnerId,
            winnerMethod: match.winnerMethod,
          });
          isClosed = true;
          controller.close();
          return;
        }

        // Start keep-alive ping
        pingInterval = setInterval(() => {
          safeEnqueue({ type: "ping" });
        }, 30000);

        // If in progress, poll for new logs and completion
        if (match?.status === "in_progress") {
          let lastActionNumber = existingLogs && existingLogs.length > 0
            ? Math.max(...(existingLogs as Array<{ actionNumber: number }>).map((l) => l.actionNumber))
            : 0;
          let completedSent = false;

          pollInterval = setInterval(async () => {
            try {
              // Check completion
              const { data: updatedMatch } = await serviceRole
                .from("combat_matches")
                .select("status, winnerId, winnerMethod")
                .eq("id", matchId)
                .maybeSingle();

              if (updatedMatch?.status === "completed" && !completedSent) {
                completedSent = true;
                safeEnqueue({
                  type: "complete",
                  winnerId: updatedMatch.winnerId,
                  winnerMethod: updatedMatch.winnerMethod,
                });
                if (pollInterval) clearInterval(pollInterval);
                if (pingInterval) clearInterval(pingInterval);
                isClosed = true;
                controller.close();
                return;
              }

              // Fetch new logs since last action
              const { data: newLogs } = await serviceRole
                .from("combat_logs")
                .select("*")
                .eq("matchId", matchId)
                .gt("actionNumber", lastActionNumber)
                .order("actionNumber", { ascending: true });

              if (newLogs && newLogs.length > 0) {
                for (const log of newLogs) {
                  const entry: CombatLogEntry = {
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
                  safeEnqueue({ type: "log", log: entry });
                  lastActionNumber = Math.max(lastActionNumber, log.actionNumber);
                }
              }
            } catch (err) {
              debug_error("SSE poll error", err);
              if (pollInterval) clearInterval(pollInterval);
            }
          }, 1000);
        }

        // Ensure cleanup on client disconnect
        const originalClose = controller.close.bind(controller);
        controller.close = () => {
          isClosed = true;
          if (pollInterval) clearInterval(pollInterval);
          if (pingInterval) clearInterval(pingInterval);
          originalClose();
        };
      } catch (error) {
        debug_error("streamMatchLogs error", error);
        safeEnqueue({ type: "error", message: "Failed to stream match" });
        isClosed = true;
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

