import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { openrouter, ensureOpenRouterKey } from "@/lib/ai/openrouter";
import type { GeneratedQuest, VolunteerInfo, QuestGenerationContext } from "@/types/quest";
import { debug_log, debug_error } from "@/utils/debug";

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
    const ludusId = typeof body?.ludusId === 'string' ? body.ludusId.trim() : null;
    const locale = typeof body?.locale === 'string' ? body.locale : 'en';

    if (!ludusId) {
      return NextResponse.json({ error: "missing_ludus_id" }, { status: 400 });
    }

    // Fetch ludus
    const { data: ludus, error: ludusErr } = await supabase
      .from('ludi')
      .select('id, userId, serverId, name, reputation, locationCity, treasury')
      .eq('id', ludusId)
      .eq('userId', user.id)
      .maybeSingle();

    if (ludusErr || !ludus) {
      return NextResponse.json({ error: "ludus_not_found" }, { status: 404 });
    }

    // Fetch gladiators for this ludus (only healthy and available ones)
    const { data: gladiators, error: gladsErr } = await supabase
      .from('gladiators')
      .select('id, name, surname, personality, stats, health, current_health, injury, sickness, alive')
      .eq('ludusId', ludusId)
      .eq('alive', true);

    if (gladsErr) {
      return NextResponse.json({ error: "failed_to_fetch_gladiators" }, { status: 500 });
    }

    if (!gladiators || gladiators.length === 0) {
      return NextResponse.json({ error: "no_gladiators_available" }, { status: 400 });
    }

    ensureOpenRouterKey();

    // Generate quest
    const questPrompt = buildQuestPrompt({
      ludusName: ludus.name,
      ludusReputation: ludus.reputation || 0,
      ludusLocation: ludus.locationCity,
      locale,
      gladiators: gladiators.map(g => ({
        id: g.id,
        name: g.name,
        surname: g.surname,
        personality: typeof g.personality === 'string' ? g.personality : '',
        stats: typeof g.stats === 'object' ? g.stats : {},
        health: g.health || 100,
        currentHealth: g.current_health || 100,
        injury: typeof g.injury === 'string' ? g.injury : undefined,
        sickness: typeof g.sickness === 'string' ? g.sickness : undefined,
      }))
    });

    const questCompletion = await openrouter.chat.completions.create({
      model: MODEL_STORYTELLING,
      messages: [{ role: "user", content: questPrompt }],
      temperature: 0.85,
      max_tokens: 500,
    });

    const questContent = questCompletion.choices[0]?.message?.content?.trim() || "";
    debug_log("Quest AI Response:", questContent);
    const quest = parseQuestResponse(questContent);

    if (!quest) {
      debug_error("Failed to parse quest response:", questContent);
      return NextResponse.json({ error: "quest_generation_failed" }, { status: 500 });
    }

    // Find volunteer gladiator
    const volunteerPrompt = buildVolunteerPrompt(quest, gladiators, locale);
    const volunteerCompletion = await openrouter.chat.completions.create({
      model: MODEL_STORYTELLING,
      messages: [{ role: "user", content: volunteerPrompt }],
      temperature: 0.8,
      max_tokens: 300,
    });

    const volunteerContent = volunteerCompletion.choices[0]?.message?.content?.trim() || "";
    debug_log("Volunteer AI Response:", volunteerContent);
    const volunteer = parseVolunteerResponse(volunteerContent, gladiators);

    if (!volunteer) {
      debug_error("Failed to parse volunteer response:", volunteerContent);
      return NextResponse.json({ error: "volunteer_selection_failed" }, { status: 500 });
    }

    // Create quest in database
    const { data: createdQuest, error: createErr } = await supabase
      .from('quests')
      .insert({
        userId: user.id,
        ludusId,
        serverId: ludus.serverId,
        gladiatorId: volunteer.gladiatorId,
        title: quest.title,
        description: quest.description,
        volunteerMessage: volunteer.volunteerMessage,
        reward: quest.reward,
        dangerPercentage: quest.dangerPercentage,
        sicknessPercentage: quest.sicknessPercentage,
        deathPercentage: quest.deathPercentage,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (createErr || !createdQuest) {
      return NextResponse.json({ error: "failed_to_create_quest" }, { status: 500 });
    }

    const volunteerGladiator = gladiators.find(g => g.id === volunteer.gladiatorId);
    return NextResponse.json({
      quest: {
        ...createdQuest,
        gladiatorName: volunteerGladiator ? `${volunteerGladiator.name} ${volunteerGladiator.surname}` : undefined,
      },
    });
  } catch (error) {
    debug_error("Quest generation error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

function buildQuestPrompt(context: QuestGenerationContext): string {
  const gladiatorsList = context.gladiators
    .map(g => `- ${g.name} ${g.surname}: ${g.personality}`)
    .join('\n');

  const isFrench = context.locale === 'fr';
  
  if (isFrench) {
    return `Vous êtes un générateur de quêtes pour un jeu de gestion de ludus de gladiateurs romains. Générez UNE SEULE quête qui soit immersive, historiquement précise et centrée sur le jeu de rôle.

CONTEXTE DU LUDUS:
- Nom: ${context.ludusName}
- Réputation: ${context.ludusReputation}/100
- Lieu: ${context.ludusLocation || 'Inconnu'}

GLADIATEURS DISPONIBLES:
${gladiatorsList}

Générez une quête au format JSON avec ces CHAMPS EXACTS:
{
  "title": "Titre de la quête (court, 3-5 mots)",
  "description": "Récit détaillé de la quête (2-3 phrases, immersif et historiquement précis)",
  "reward": <nombre entre 1 et 5>,
  "dangerPercentage": <nombre 0-99>,
  "sicknessPercentage": <nombre 0-99>,
  "deathPercentage": <nombre 0-99>
}

La quête doit être:
- Historiquement précise pour l'époque romaine
- Immersive et centrée sur le jeu de rôle
- Appropriée pour les gladiateurs (combat, arène, survie, honneur)
- Dangereuse mais pas impossible
- La récompense doit refléter le niveau de danger

IMPORTANT: Retournez SEULEMENT du JSON valide, sans autre texte.`;
  }

  return `You are a quest generator for a Roman gladiator ludus management game. Generate ONE quest that is immersive, historically accurate, and roleplay-focused.

LUDUS CONTEXT:
- Name: ${context.ludusName}
- Reputation: ${context.ludusReputation}/100
- Location: ${context.ludusLocation || 'Unknown'}

AVAILABLE GLADIATORS:
${gladiatorsList}

Generate a quest in JSON format with these EXACT fields:
{
  "title": "Quest title (short, 3-5 words)",
  "description": "Detailed quest narrative (2-3 sentences, immersive and historically accurate)",
  "reward": <number between 1 and 5>,
  "dangerPercentage": <number 0-99>,
  "sicknessPercentage": <number 0-99>,
  "deathPercentage": <number 0-99>
}

The quest should be:
- Historically accurate to Roman times
- Immersive and roleplay-focused
- Appropriate for gladiators (combat, arena, survival, honor-related)
- Dangerous but not impossible
- Reward should reflect the danger level

IMPORTANT: Return ONLY valid JSON, no other text.`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildVolunteerPrompt(quest: GeneratedQuest, gladiators: any[], locale: string = 'en'): string {
  const gladiatorsList = gladiators
    .map(g => `- ${g.id}: ${g.name} ${g.surname} (${g.personality})`)
    .join('\n');

  const isFrench = locale === 'fr';

  if (isFrench) {
    return `Vous sélectionnez un gladiateur volontaire pour cette quête :
"${quest.title}: ${quest.description}"

GLADIATEURS DISPONIBLES:
${gladiatorsList}

Sélectionnez le MEILLEUR volontaire en fonction de sa personnalité et des exigences de la quête. Générez ensuite un message de jeu de rôle de ce gladiateur expliquant pourquoi il se porte volontaire.

Répondez au format JSON :
{
  "gladiatorId": "<uuid du gladiateur sélectionné>",
  "volunteerMessage": "Un message de jeu de rôle de 1-2 phrases du gladiateur expliquant sa motivation"
}

Le message doit être dans le personnage, dramatique et immersif.
IMPORTANT: Retournez SEULEMENT du JSON valide, sans autre texte.`;
  }

  return `You are selecting a volunteer gladiator for this quest:
"${quest.title}: ${quest.description}"

AVAILABLE GLADIATORS:
${gladiatorsList}

Select the BEST volunteer based on their personality and the quest requirements. Then generate a roleplay message from that gladiator explaining why they volunteer.

Respond in JSON format:
{
  "gladiatorId": "<uuid of selected gladiator>",
  "volunteerMessage": "A 1-2 sentence roleplay message from the gladiator explaining their motivation"
}

The message should be in character, dramatic, and immersive.
IMPORTANT: Return ONLY valid JSON, no other text.`;
}

function parseQuestResponse(content: string): GeneratedQuest | null {
  try {
    // Remove markdown code blocks if present
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    const json = JSON.parse(jsonStr);
    return {
      title: String(json.title || 'Unknown Quest'),
      description: String(json.description || 'A mysterious quest awaits.'),
      reward: Math.max(1, Math.min(5, Number(json.reward) || 2)),
      dangerPercentage: Math.max(0, Math.min(99, Number(json.dangerPercentage) || 30)),
      sicknessPercentage: Math.max(0, Math.min(99, Number(json.sicknessPercentage) || 20)),
      deathPercentage: Math.max(0, Math.min(99, Number(json.deathPercentage) || 10)),
    };
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseVolunteerResponse(content: string, gladiators: any[]): VolunteerInfo | null {
  try {
    // Remove markdown code blocks if present
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    const json = JSON.parse(jsonStr);
    const gladiatorId = String(json.gladiatorId || '');

    // Verify gladiator exists
    if (!gladiators.find(g => g.id === gladiatorId)) {
      // Fallback to first available gladiator
      if (gladiators.length > 0) {
        return {
          gladiatorId: gladiators[0].id,
          volunteerMessage: String(json.volunteerMessage || 'I will undertake this quest!'),
        };
      }
      return null;
    }

    return {
      gladiatorId,
      volunteerMessage: String(json.volunteerMessage || 'I will undertake this quest!'),
    };
  } catch {
    return null;
  }
}

