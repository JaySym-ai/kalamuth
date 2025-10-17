import { createServiceRoleClient } from "@/utils/supabase/server";
import { requireAuthAPI } from "@/lib/auth/server";
import { handleAPIError, notFoundResponse } from "@/lib/api/errors";
import { NextResponse } from "next/server";
import { getOpenRouterClient } from "@/lib/ai/client";
import { ARENAS } from "@/data/arenas";
import { getCombatConfigForArena } from "@/lib/combat/config";
import type { CombatGladiator, CombatLogEntry, BattleState } from "@/types/combat";
import { debug_error, debug_log } from "@/utils/debug";
import { streamMatchLogs } from "@/lib/combat/streams";
import { normalizeGladiator } from "@/lib/gladiator/normalize";
import { toCombatGladiator } from "@/lib/gladiator/adapters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Model for storytelling/narration
const MODEL_STORYTELLING = "google/gemini-2.5-flash-lite";

// Shared streaming utility replaces this local duplicate implementation

export async function GET(
  req: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  // Note: Auth check is done inside try-catch to handle streaming errors properly
  try {
    const { user, supabase } = await requireAuthAPI();

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
    return notFoundResponse("match");
  }

  // Verify user is a participant
  const { data: participantCheck } = await supabase
    .from("gladiators")
    .select("id")
    .in("id", [match.gladiator1Id, match.gladiator2Id])
    .eq("userId", user.id);

  if (!participantCheck || participantCheck.length === 0) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Use service role for system operations
  const serviceRole = createServiceRoleClient();

  // Check if match is already in progress or completed
  if (match.status !== "pending") {
    // Match already started - use shared streaming utility
    // This handles the case where both users try to start simultaneously
    return streamMatchLogs(matchId);
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
    throw new Error("Failed to load gladiators");
  }

  // Ensure correct order: gladiator1 must match gladiator1Id, gladiator2 must match gladiator2Id
  const gladiator1Raw = (gladiatorRows as Array<{ id: string }>).find((g) => g.id === match.gladiator1Id);
  const gladiator2Raw = (gladiatorRows as Array<{ id: string }>).find((g) => g.id === match.gladiator2Id);

  if (!gladiator1Raw || !gladiator2Raw) {
    throw new Error("Failed to load gladiators");
  }

  const g1Norm = normalizeGladiator(String(gladiator1Raw.id), gladiator1Raw as Record<string, unknown>, locale);
  const g2Norm = normalizeGladiator(String(gladiator2Raw.id), gladiator2Raw as Record<string, unknown>, locale);
  const gladiator1: CombatGladiator = toCombatGladiator(g1Norm);
  const gladiator2: CombatGladiator = toCombatGladiator(g2Norm);

  // Get arena and combat config
  const arena = ARENAS.find((a) => a.name.toLowerCase().replace(/\s+/g, "-") === match.arenaSlug);
  if (!arena) {
    return notFoundResponse("arena");
  }

  const config = getCombatConfigForArena(arena);

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Track if controller is closed to prevent sending events after close
      let isClosed = false;

      try {
        const client = getOpenRouterClient();

        // Helper to send SSE message
        const sendEvent = (data: unknown) => {
          if (isClosed) return; // Don't send if controller is closed
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          } catch (error) {
            // Controller might be closed, mark it and stop trying to send
            isClosed = true;
            debug_error("Failed to send event (controller likely closed):", error);
          }
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
        const introMessage = await generateIntroduction(gladiator1, gladiator2, arena.name, locale, client);
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
            locale,
            client
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

        // Handle end-of-match outcomes (decision or draw)
        if (!battleState.isComplete) {
          battleState.isComplete = true;

          const remainingHealth1 = battleState.gladiator1Health;
          const remainingHealth2 = battleState.gladiator2Health;

          if (remainingHealth1 === remainingHealth2) {
            const drawMessage = locale === "fr"
              ? `Après ${battleState.actionNumber} actions, ${gladiator1.name} ${gladiator1.surname} et ${gladiator2.name} ${gladiator2.surname} restent tous deux debout. Les juges déclarent un match nul.`
              : `After ${battleState.actionNumber} actions, ${gladiator1.name} ${gladiator1.surname} and ${gladiator2.name} ${gladiator2.surname} both remain standing. The judges declare the bout a draw.`;
            const drawLog = await saveLog(
              supabase,
              matchId,
              battleState.actionNumber + 1,
              "system",
              drawMessage,
              locale,
              battleState
            );
            sendEvent({ type: "log", log: drawLog });
          } else {
            const decisionWinner = remainingHealth1 > remainingHealth2 ? gladiator1 : gladiator2;
            battleState.winnerId = decisionWinner.id;
            battleState.winnerMethod = "decision";
          }
        }

        if (battleState.isComplete) {
          if (battleState.winnerId) {
            const winnerName = battleState.winnerId === gladiator1.id
              ? `${gladiator1.name} ${gladiator1.surname}`
              : `${gladiator2.name} ${gladiator2.surname}`;
            const loser = battleState.winnerId === gladiator1.id ? gladiator2 : gladiator1;

            const victoryMessage = battleState.winnerMethod === "decision"
              ? locale === "fr"
                ? `Après ${battleState.actionNumber} actions, les juges accordent la décision à ${winnerName} face à ${loser.name} ${loser.surname}.`
                : `After ${battleState.actionNumber} actions, the judges award the decision to ${winnerName} over ${loser.name} ${loser.surname}.`
              : await generateVictory(winnerName, battleState.winnerMethod || "knockout", locale, client);
            const victoryLog = await saveLog(supabase, matchId, battleState.actionNumber + 1, "victory", victoryMessage, locale, battleState);
            sendEvent({ type: "log", log: victoryLog });
          }

          // Update match record (completed for both victory and draw)
          const { error: updateError } = await serviceRole
            .from("combat_matches")
            .update({
              status: "completed",
              completedAt: new Date().toISOString(),
              winnerId: battleState.winnerId ?? null,
              winnerMethod: battleState.winnerMethod ?? null,
              totalActions: battleState.actionNumber,
            })
            .eq("id", matchId);

          if (updateError) {
            debug_error("Failed to update match status to completed:", updateError);
            sendEvent({ type: "error", message: "Failed to save match result" });
          } else {
            debug_log(`✅ Match ${matchId} marked as completed`);
          }

          // Remove both gladiators from the queue
          const { error: queueError } = await serviceRole
            .from("combat_queue")
            .delete()
            .in("gladiatorId", [match.gladiator1Id, match.gladiator2Id]);

          if (queueError) {
            debug_error("Failed to remove gladiators from queue:", queueError);
          } else {
            debug_log(`✅ Removed gladiators from queue: ${match.gladiator1Id}, ${match.gladiator2Id}`);
          }

          sendEvent({ type: "complete", winnerId: battleState.winnerId, winnerMethod: battleState.winnerMethod });
        }

        isClosed = true;
        controller.close();
      } catch (error) {
        debug_error("Combat stream error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        if (!isClosed) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: errorMessage })}\n\n`));
        }
        isClosed = true;
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
  } catch (error) {
    return handleAPIError(error, "Combat match start");
  }
}

// Helper functions

async function saveLog(
  _supabase: ReturnType<typeof createServiceRoleClient>,
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
  locale: string,
  client: ReturnType<typeof getOpenRouterClient>
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

  const completion = await client.chat.completions.create({
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
  _config: { deathChancePercent: number; injuryChancePercent: number },
  locale: string,
  client: ReturnType<typeof getOpenRouterClient>
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

  const completion = await client.chat.completions.create({
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
  locale: string,
  client: ReturnType<typeof getOpenRouterClient>
): Promise<string> {
  const prompt = `You are a gladiator arena commentator. Write ONLY the victory announcement itself, with NO meta-commentary.

Winner: ${winnerName}
Victory method: ${method}

Write 1-2 sentences announcing the victory in ${locale === "fr" ? "French" : "English"}. Make it epic and celebratory!

IMPORTANT: Write ONLY the announcement. Do NOT include phrases like "Voici l'annonce" or "Here is". Start directly with the victory announcement.`;

  const completion = await client.chat.completions.create({
    model: MODEL_STORYTELLING,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.9,
    max_tokens: 100,
  });

  const rawContent = completion.choices[0]?.message?.content?.trim() || `${winnerName} is victorious!`;
  return cleanNarration(rawContent);
}
