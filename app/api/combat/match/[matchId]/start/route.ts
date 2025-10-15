import { cookies } from "next/headers";
import { createClient, createServiceRoleClient } from "@/utils/supabase/server";
import { openrouter, ensureOpenRouterKey } from "@/lib/ai/openrouter";
import { ARENAS } from "@/data/arenas";
import { getCombatConfigForArena } from "@/lib/combat/config";
import type { CombatGladiator, CombatLogEntry, BattleState } from "@/types/combat";
import { debug_error } from "@/utils/debug";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Model for storytelling/narration
const MODEL_STORYTELLING = "google/gemini-2.5-flash-lite";

// Helper function to create a watch stream for existing matches
async function createWatchStream(
  matchId: string,
  locale: string
): Promise<Response> {
  // Use service role for system operations to bypass RLS
  const serviceRole = createServiceRoleClient();

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Helper to send SSE message
        const sendEvent = (data: unknown) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        // Fetch all existing logs for this match using service role
        const { data: existingLogs, error: logsError } = await serviceRole
          .from("combat_logs")
          .select("*")
          .eq("matchId", matchId)
          .order("actionNumber", { ascending: true });

        if (logsError) {
          throw new Error(`Failed to fetch logs: ${logsError.message}`);
        }

        // Send existing logs
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

        // Check current match status using service role
        const { data: match } = await serviceRole
          .from("combat_matches")
          .select("status, winnerId, winnerMethod")
          .eq("id", matchId)
          .maybeSingle();

        // If match is completed, send completion event and close
        if (match?.status === "completed") {
          sendEvent({
            type: "complete",
            winnerId: match.winnerId,
            winnerMethod: match.winnerMethod,
          });
          controller.close();
          return;
        }

        // If match is in progress, poll for new logs
        if (match?.status === "in_progress") {
          let lastActionNumber = existingLogs && existingLogs.length > 0
            ? Math.max(...existingLogs.map((log) => log.actionNumber))
            : 0;
          let isComplete = false;

          // Poll for new logs every 1 second
          const pollInterval = setInterval(async () => {
            try {
              // Check if match is complete using service role
              const { data: updatedMatch } = await serviceRole
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

              // Fetch new logs since last action using service role
              const { data: newLogs } = await serviceRole
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

        // Send periodic ping to keep connection alive
        const pingInterval = setInterval(() => {
          sendEvent({ type: "ping" });
        }, 30000);

        // Handle client disconnect
        const originalClose = controller.close.bind(controller);
        controller.close = () => {
          clearInterval(pingInterval);
          originalClose();
        };
      } catch (error) {
        debug_error("Watch stream error:", error);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "error", message: "Failed to watch match" })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  });
}

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
  const url = new URL(req.url);
  const locale = url.searchParams.get("locale") || "en";

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

  // Use service role for system operations
  const serviceRole = createServiceRoleClient();

  // Check if match is already in progress or completed
  if (match.status !== "pending") {
    // Match already started - stream existing logs like the watch endpoint
    // This handles the case where both users try to start simultaneously
    return createWatchStream(matchId, locale);
  }

  // Update match status to in_progress
  await serviceRole
    .from("combat_matches")
    .update({ status: "in_progress", startedAt: new Date().toISOString() })
    .eq("id", matchId);

  // Fetch full gladiator data
  const { data: gladiatorRows } = await supabase
    .from("gladiators")
    .select("*")
    .in("id", [match.gladiator1Id, match.gladiator2Id]);

  if (!gladiatorRows || gladiatorRows.length !== 2) {
    return new Response("Failed to load gladiators", { status: 500 });
  }

  // Ensure correct order: gladiator1 must match gladiator1Id, gladiator2 must match gladiator2Id
  const gladiator1Raw = gladiatorRows.find((g) => g.id === match.gladiator1Id);
  const gladiator2Raw = gladiatorRows.find((g) => g.id === match.gladiator2Id);

  if (!gladiator1Raw || !gladiator2Raw) {
    return new Response("Failed to load gladiators", { status: 500 });
  }

  const gladiator1 = normalizeGladiator(gladiator1Raw, locale);
  const gladiator2 = normalizeGladiator(gladiator2Raw, locale);

  // Get arena and combat config
  const arena = ARENAS.find((a) => a.name.toLowerCase().replace(/\s+/g, "-") === match.arenaSlug);
  if (!arena) {
    return new Response("Arena not found", { status: 404 });
  }

  const config = getCombatConfigForArena(arena);

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        ensureOpenRouterKey();

        // Helper to send SSE message
        const sendEvent = (data: unknown) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        // Initialize battle state
        const battleState: BattleState = {
          matchId,
          actionNumber: 0,
          gladiator1Health: gladiator1.health,
          gladiator2Health: gladiator2.health,
          isComplete: false,
        };

        // Send introduction
        const introMessage = await generateIntroduction(gladiator1, gladiator2, arena.name, locale);
        const introLog = await saveLog(supabase, matchId, 0, "introduction", introMessage, locale, battleState);
        sendEvent({ type: "log", log: introLog });

        // Combat loop
        for (let i = 1; i <= config.maxActions; i++) {
          if (battleState.isComplete) break;

          battleState.actionNumber = i;

          // Generate action
          const actionMessage = await generateAction(
            gladiator1,
            gladiator2,
            battleState,
            arena,
            config,
            locale
          );

          // Calculate damage and update health
          const damage = calculateDamage();
          const targetGladiator = Math.random() > 0.5 ? 1 : 2;

          if (targetGladiator === 1) {
            battleState.gladiator1Health = Math.max(0, battleState.gladiator1Health - damage);
          } else {
            battleState.gladiator2Health = Math.max(0, battleState.gladiator2Health - damage);
          }

          // Check for victory
          if (battleState.gladiator1Health <= 0 || battleState.gladiator2Health <= 0) {
            battleState.isComplete = true;
            battleState.winnerId = battleState.gladiator1Health > 0 ? gladiator1.id : gladiator2.id;
            battleState.winnerMethod = arena.deathEnabled && Math.random() * 100 < config.deathChancePercent
              ? "death"
              : "knockout";
          }

          // Save action log
          const actionLog = await saveLog(supabase, matchId, i, "action", actionMessage, locale, battleState);
          sendEvent({ type: "log", log: actionLog });

          // Wait for interval
          await new Promise((resolve) => setTimeout(resolve, config.actionIntervalSeconds * 1000));
        }

        // Send victory message if complete
        if (battleState.isComplete && battleState.winnerId) {
          const winnerName = battleState.winnerId === gladiator1.id
            ? `${gladiator1.name} ${gladiator1.surname}`
            : `${gladiator2.name} ${gladiator2.surname}`;

          const victoryMessage = await generateVictory(winnerName, battleState.winnerMethod || "knockout", locale);
          const victoryLog = await saveLog(supabase, matchId, battleState.actionNumber + 1, "victory", victoryMessage, locale, battleState);
          sendEvent({ type: "log", log: victoryLog });

          // Update match with winner
          await serviceRole
            .from("combat_matches")
            .update({
              status: "completed",
              completedAt: new Date().toISOString(),
              winnerId: battleState.winnerId,
              winnerMethod: battleState.winnerMethod,
              totalActions: battleState.actionNumber,
            })
            .eq("id", matchId);

          // Remove both gladiators from the queue
          await serviceRole
            .from("combat_queue")
            .delete()
            .in("gladiatorId", [match.gladiator1Id, match.gladiator2Id]);

          sendEvent({ type: "complete", winnerId: battleState.winnerId, winnerMethod: battleState.winnerMethod });
        }

        controller.close();
      } catch (error) {
        debug_error("Combat stream error:", error);
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

// Helper functions
function normalizeGladiator(row: Record<string, unknown>, locale: string): CombatGladiator {
  const extractText = (field: unknown): string => {
    if (typeof field === "string") return field;
    if (field && typeof field === "object" && locale in field) {
      return (field as Record<string, string>)[locale];
    }
    return "";
  };

  const extractStats = (stats: unknown) => {
    if (!stats || typeof stats !== "object") {
      return {
        strength: "", agility: "", dexterity: "", speed: "",
        chance: "", intelligence: "", charisma: "", loyalty: "",
      };
    }
    const s = stats as Record<string, unknown>;
    return {
      strength: extractText(s.strength),
      agility: extractText(s.agility),
      dexterity: extractText(s.dexterity),
      speed: extractText(s.speed),
      chance: extractText(s.chance),
      intelligence: extractText(s.intelligence),
      charisma: extractText(s.charisma),
      loyalty: extractText(s.loyalty),
    };
  };

  const maxHealth = row.health as number;
  return {
    id: row.id as string,
    name: row.name as string,
    surname: row.surname as string,
    avatarUrl: row.avatarUrl as string,
    rankingPoints: row.rankingPoints as number,
    health: maxHealth,
    currentHealth: maxHealth,
    userId: row.userId as string,
    ludusId: row.ludusId as string,
    alive: row.alive as boolean,
    injury: extractText(row.injury),
    sickness: extractText(row.sickness),
    stats: extractStats(row.stats),
    lifeGoal: extractText(row.lifeGoal),
    personality: extractText(row.personality),
    backstory: extractText(row.backstory),
    weakness: extractText(row.weakness),
    fear: extractText(row.fear),
    likes: extractText(row.likes),
    dislikes: extractText(row.dislikes),
    birthCity: row.birthCity as string,
    handicap: extractText(row.handicap),
    uniquePower: extractText(row.uniquePower),
    physicalCondition: extractText(row.physicalCondition),
    notableHistory: extractText(row.notableHistory),
  };
}

async function saveLog(
  supabase: ReturnType<typeof createServiceRoleClient>,
  matchId: string,
  actionNumber: number,
  type: string,
  message: string,
  locale: string,
  state: BattleState
): Promise<CombatLogEntry> {
  // Use service role for system operations
  const serviceRole = createServiceRoleClient();
  const { data, error } = await serviceRole
    .from("combat_logs")
    .insert({
      matchId,
      actionNumber,
      type,
      message,
      locale,
      gladiator1Health: state.gladiator1Health,
      gladiator2Health: state.gladiator2Health,
    })
    .select("*")
    .single();

  if (error) throw error;

  return {
    id: data.id,
    matchId: data.matchId,
    actionNumber: data.actionNumber,
    message: data.message,
    createdAt: data.createdAt,
    type: data.type as "introduction" | "action" | "injury" | "death" | "victory" | "system",
    locale: data.locale,
    gladiator1Health: data.gladiator1Health,
    gladiator2Health: data.gladiator2Health,
  };
}

function calculateDamage(): number {
  // Simple damage calculation (10-30 HP per action)
  return Math.floor(Math.random() * 21) + 10;
}

/**
 * Cleans AI-generated narration by removing unwanted meta-commentary and formatting
 */
function cleanNarration(text: string): string {
  let cleaned = text.trim();

  // Remove quotes at start and end
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) ||
      (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  // Remove common meta-commentary patterns (French)
  cleaned = cleaned.replace(/^Voici une narration.*?:\s*/i, '');
  cleaned = cleaned.replace(/^Voici l[ae] narration.*?:\s*/i, '');
  cleaned = cleaned.replace(/^Pour l'action #?\d+\s*:\s*/i, '');
  cleaned = cleaned.replace(/^Action #?\d+\s*:\s*/i, '');

  // Remove common meta-commentary patterns (English)
  cleaned = cleaned.replace(/^Here is.*?:\s*/i, '');
  cleaned = cleaned.replace(/^Here's.*?:\s*/i, '');
  cleaned = cleaned.replace(/^For action #?\d+\s*:\s*/i, '');
  cleaned = cleaned.replace(/^Action #?\d+\s*:\s*/i, '');

  // Remove action number references
  cleaned = cleaned.replace(/#\d+/g, '');

  // Clean up any double spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

async function generateIntroduction(
  g1: CombatGladiator,
  g2: CombatGladiator,
  arenaName: string,
  locale: string
): Promise<string> {
  const prompt = `You are a gladiator arena commentator. Write ONLY the introduction itself, with NO meta-commentary.

Arena: ${arenaName}

Gladiator 1: ${g1.name} ${g1.surname}
- From: ${g1.birthCity}
- Personality: ${g1.personality}
- Notable: ${g1.notableHistory}

Gladiator 2: ${g2.name} ${g2.surname}
- From: ${g2.birthCity}
- Personality: ${g2.personality}
- Notable: ${g2.notableHistory}

Write a dramatic 2-3 sentence introduction in ${locale === "fr" ? "French" : "English"} as if you're announcing them to the crowd. Make it exciting and theatrical!

IMPORTANT: Write ONLY the announcement. Do NOT include phrases like "Voici une introduction" or "Here is". Start directly with the announcement.`;

  const completion = await openrouter.chat.completions.create({
    model: MODEL_STORYTELLING,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.9,
    max_tokens: 200,
  });

  const rawContent = completion.choices[0]?.message?.content?.trim() || "The gladiators enter the arena!";
  return cleanNarration(rawContent);
}

async function generateAction(
  g1: CombatGladiator,
  g2: CombatGladiator,
  state: BattleState,
  arena: { name: string; deathEnabled: boolean },
  config: { deathChancePercent: number; injuryChancePercent: number },
  locale: string
): Promise<string> {
  const prompt = `You are a gladiator arena commentator. Write ONLY the narration itself, with NO introduction, NO meta-commentary, NO action numbers.

Arena: ${arena.name} (Death ${arena.deathEnabled ? "ALLOWED" : "FORBIDDEN"})

Gladiator 1: ${g1.name} ${g1.surname} (HP: ${state.gladiator1Health}/${g1.health})
- Strength: ${g1.stats.strength}
- Agility: ${g1.stats.agility}
- Weakness: ${g1.weakness}
- Current condition: ${g1.physicalCondition}
${g1.injury ? `- Injured: ${g1.injury}` : ""}

Gladiator 2: ${g2.name} ${g2.surname} (HP: ${state.gladiator2Health}/${g2.health})
- Strength: ${g2.stats.strength}
- Agility: ${g2.stats.agility}
- Weakness: ${g2.weakness}
- Current condition: ${g2.physicalCondition}
${g2.injury ? `- Injured: ${g2.injury}` : ""}

Write 1-2 sentences of realistic gladiator combat narration in ${locale === "fr" ? "French" : "English"}. Describe a specific action, attack, defense, or maneuver. Consider their traits, injuries, and current health. Make it vivid and dramatic!

IMPORTANT: Write ONLY the narration. Do NOT include phrases like "Voici une narration" or "Here is" or action numbers. Start directly with the action description.`;

  const completion = await openrouter.chat.completions.create({
    model: MODEL_STORYTELLING,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.85,
    max_tokens: 150,
  });

  const rawContent = completion.choices[0]?.message?.content?.trim() || "The battle continues!";
  return cleanNarration(rawContent);
}

async function generateVictory(
  winnerName: string,
  method: string,
  locale: string
): Promise<string> {
  const prompt = `You are a gladiator arena commentator. Write ONLY the victory announcement itself, with NO meta-commentary.

Winner: ${winnerName}
Victory method: ${method}

Write 1-2 sentences announcing the victory in ${locale === "fr" ? "French" : "English"}. Make it epic and celebratory!

IMPORTANT: Write ONLY the announcement. Do NOT include phrases like "Voici l'annonce" or "Here is". Start directly with the victory announcement.`;

  const completion = await openrouter.chat.completions.create({
    model: MODEL_STORYTELLING,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.9,
    max_tokens: 100,
  });

  const rawContent = completion.choices[0]?.message?.content?.trim() || `${winnerName} is victorious!`;
  return cleanNarration(rawContent);
}

