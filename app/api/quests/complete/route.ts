import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient, createServiceRoleClient } from "@/utils/supabase/server";
import { openrouter, ensureOpenRouterKey } from "@/lib/ai/openrouter";
import type { QuestResult } from "@/types/quest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL_STORYTELLING = "google/gemini-2.5-flash-lite";

export async function POST(req: Request) {
  try {
    const supabase = createClient(await cookies());
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const questId = typeof body?.questId === 'string' ? body.questId.trim() : null;

    if (!questId) {
      return NextResponse.json({ error: "missing_quest_id" }, { status: 400 });
    }

    // Fetch quest
    const { data: quest, error: questErr } = await supabase
      .from('quests')
      .select('*')
      .eq('id', questId)
      .eq('userId', user.id)
      .maybeSingle();

    if (questErr || !quest) {
      return NextResponse.json({ error: "quest_not_found" }, { status: 404 });
    }

    if (quest.status !== 'active') {
      return NextResponse.json({ error: "quest_not_active" }, { status: 400 });
    }

    // Fetch gladiator
    const { data: gladiator } = await supabase
      .from('gladiators')
      .select('id, name, surname, health, current_health, personality, stats')
      .eq('id', quest.gladiatorId)
      .maybeSingle();

    if (!gladiator) {
      return NextResponse.json({ error: "gladiator_not_found" }, { status: 404 });
    }

    ensureOpenRouterKey();

    // Generate quest results
    const resultPrompt = buildResultPrompt(quest, gladiator);
    const resultCompletion = await openrouter.chat.completions.create({
      model: MODEL_STORYTELLING,
      messages: [{ role: "user", content: resultPrompt }],
      temperature: 0.85,
      max_tokens: 600,
    });

    const resultContent = resultCompletion.choices[0]?.message?.content?.trim() || "";
    const result = parseResultResponse(resultContent);

    if (!result) {
      return NextResponse.json({ error: "result_generation_failed" }, { status: 500 });
    }

    // Update gladiator health and conditions if needed
    const serviceSupabase = createServiceRoleClient();
    let newHealth = gladiator.current_health - result.healthLost;
    newHealth = Math.max(0, Math.min(gladiator.health, newHealth));

    const updateData: Record<string, any> = {
      current_health: newHealth,
    };

    if (result.gladiatorDied) {
      updateData.alive = false;
    }

    if (result.injuryContracted) {
      updateData.injury = result.injuryContracted;
      updateData.injuryTimeLeftHours = 24; // 24 hours recovery
    }

    if (result.sicknessContracted) {
      updateData.sickness = result.sicknessContracted;
    }

    await serviceSupabase
      .from('gladiators')
      .update(updateData)
      .eq('id', quest.gladiatorId);

    // Update ludus treasury with reward
    const { data: ludus } = await supabase
      .from('ludi')
      .select('treasury')
      .eq('id', quest.ludusId)
      .maybeSingle();

    if (ludus && ludus.treasury) {
      const treasury = ludus.treasury as { currency: string; amount: number };
      const newAmount = treasury.amount + quest.reward;
      
      await serviceSupabase
        .from('ludi')
        .update({
          treasury: {
            currency: treasury.currency || 'sestertii',
            amount: newAmount,
          },
        })
        .eq('id', quest.ludusId);
    }

    // Update quest with results
    const completionTime = new Date().toISOString();
    const { error: updateErr } = await supabase
      .from('quests')
      .update({
        status: result.questFailed ? 'failed' : 'completed',
        completedAt: completionTime,
        result: result.result,
        healthLost: result.healthLost,
        sicknessContracted: result.sicknessContracted,
        injuryContracted: result.injuryContracted,
        questFailed: result.questFailed,
        gladiatorDied: result.gladiatorDied,
        updatedAt: completionTime,
      })
      .eq('id', questId);

    if (updateErr) {
      return NextResponse.json({ error: "failed_to_update_quest" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      questId,
      result: {
        narrative: result.result,
        healthLost: result.healthLost,
        sicknessContracted: result.sicknessContracted,
        injuryContracted: result.injuryContracted,
        questFailed: result.questFailed,
        gladiatorDied: result.gladiatorDied,
        rewardEarned: quest.reward,
      },
    });
  } catch (error) {
    console.error("Quest completion error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

function buildResultPrompt(quest: any, gladiator: any): string {
  return `You are a quest narrator for a Roman gladiator game. Generate the outcome of a quest that just completed.

QUEST DETAILS:
- Title: ${quest.title}
- Description: ${quest.description}
- Danger Risk: ${quest.dangerPercentage}%
- Sickness Risk: ${quest.sicknessPercentage}%
- Death Risk: ${quest.deathPercentage}%

GLADIATOR:
- Name: ${gladiator.name} ${gladiator.surname}
- Health: ${gladiator.current_health}/${gladiator.health}
- Personality: ${gladiator.personality}

Generate a quest outcome in JSON format:
{
  "result": "A 3-4 sentence narrative describing what happened during the quest",
  "healthLost": <number 0-50>,
  "sicknessContracted": null or "description of sickness",
  "injuryContracted": null or "description of injury",
  "questFailed": <boolean>,
  "gladiatorDied": <boolean>
}

The outcome should:
- Be immersive and dramatic
- Reflect the quest's danger level
- Consider the gladiator's personality
- Be historically accurate
- Include consequences based on risk percentages

IMPORTANT: Return ONLY valid JSON, no other text.`;
}

function parseResultResponse(content: string): QuestResult | null {
  try {
    const json = JSON.parse(content);
    return {
      result: String(json.result || 'The quest concluded.'),
      healthLost: Math.max(0, Number(json.healthLost) || 0),
      sicknessContracted: json.sicknessContracted ? String(json.sicknessContracted) : undefined,
      injuryContracted: json.injuryContracted ? String(json.injuryContracted) : undefined,
      questFailed: Boolean(json.questFailed),
      gladiatorDied: Boolean(json.gladiatorDied),
    };
  } catch {
    return null;
  }
}

