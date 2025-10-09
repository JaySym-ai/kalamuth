import { cookies } from "next/headers";
import { createClient, createServiceRoleClient } from "@/utils/supabase/server";
import { openrouter, ensureOpenRouterKey } from "@/lib/ai/openrouter";
import { ARENAS } from "@/data/arenas";
import { getCombatConfigForArena } from "@/lib/combat/config";
import type { CombatGladiator, CombatLogEntry, BattleState } from "@/types/combat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Model for storytelling/narration
const MODEL_STORYTELLING = "google/gemini-2.5-flash-lite";

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
    // Match already started - redirect to watch endpoint to get existing logs
    // This handles the case where both users try to start simultaneously
    const watchUrl = new URL(req.url);
    watchUrl.pathname = `/api/combat/match/${matchId}/watch`;
    return fetch(watchUrl.toString());
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
          const damage = calculateDamage(gladiator1, gladiator2, battleState);
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
        console.error("Combat stream error:", error);
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

  return {
    id: row.id as string,
    name: row.name as string,
    surname: row.surname as string,
    avatarUrl: row.avatarUrl as string,
    rankingPoints: row.rankingPoints as number,
    health: row.health as number,
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
  supabase: any,
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
    type: data.type as any,
    locale: data.locale,
    gladiator1Health: data.gladiator1Health,
    gladiator2Health: data.gladiator2Health,
  };
}

function calculateDamage(g1: CombatGladiator, g2: CombatGladiator, state: BattleState): number {
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

