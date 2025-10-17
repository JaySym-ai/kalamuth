import { NextResponse } from "next/server";
import { requireAuthAPI } from "@/lib/auth/server";
import OpenAI from "openai";
import { debug_error } from "@/utils/debug";

export const runtime = "nodejs";

interface GladiatorContext {
  name: string;
  surname: string;
  personality: string;
  backstory: string;
  lifeGoal: string;
  likes: string;
  dislikes: string;
  weakness: string;
  fear: string;
  stats: {
    strength: string;
    agility: string;
    dexterity: string;
    speed: string;
    chance: string;
    intelligence: string;
    charisma: string;
    loyalty: string;
  };
  injury?: string;
  sickness?: string;
  handicap?: string;
  uniquePower?: string;
  physicalCondition: string;
  notableHistory: string;
  birthCity: string;
  health: number;
}

export async function POST(req: Request) {
  try {
    const { user, supabase } = await requireAuthAPI();

    const body = await req.json().catch(() => ({}));
    const message = typeof body?.message === 'string' ? body.message.trim() : null;
    const gladiatorId = typeof body?.gladiatorId === 'string' ? body.gladiatorId.trim() : null;
    const ludusId = typeof body?.ludusId === 'string' ? body.ludusId.trim() : null;
    const locale = typeof body?.locale === 'string' ? body.locale.trim() : 'en';
    const conversationHistory = Array.isArray(body?.conversationHistory) ? body.conversationHistory : [];

    if (!message || !gladiatorId || !ludusId) {
      return NextResponse.json({ error: "missing_parameters" }, { status: 400 });
    }

    // Fetch tavern gladiator
    const { data: gladiator, error: gladErr } = await supabase
      .from('tavern_gladiators')
      .select('*')
      .eq('id', gladiatorId)
      .eq('ludusId', ludusId)
      .maybeSingle();

    if (gladErr || !gladiator) {
      return NextResponse.json({ error: "gladiator_not_found" }, { status: 404 });
    }

    // Build gladiator context from bilingual data
    const getLocalizedText = (field: unknown): string => {
      if (typeof field === 'string') return field;
      if (field && typeof field === 'object') {
        const obj = field as Record<string, unknown>;
        return typeof obj[locale] === 'string' ? obj[locale] : 
               typeof obj.en === 'string' ? obj.en : 
               String(field);
      }
      return '';
    };

    const getLocalizedStats = (stats: unknown) => {
      if (!stats || typeof stats !== 'object') {
        return {
          strength: '', agility: '', dexterity: '', speed: '',
          chance: '', intelligence: '', charisma: '', loyalty: ''
        };
      }
      const s = stats as Record<string, unknown>;
      return {
        strength: getLocalizedText(s.strength),
        agility: getLocalizedText(s.agility),
        dexterity: getLocalizedText(s.dexterity),
        speed: getLocalizedText(s.speed),
        chance: getLocalizedText(s.chance),
        intelligence: getLocalizedText(s.intelligence),
        charisma: getLocalizedText(s.charisma),
        loyalty: getLocalizedText(s.loyalty),
      };
    };

    const context: GladiatorContext = {
      name: String(gladiator.name || ''),
      surname: String(gladiator.surname || ''),
      personality: getLocalizedText(gladiator.personality),
      backstory: getLocalizedText(gladiator.backstory),
      lifeGoal: getLocalizedText(gladiator.lifeGoal),
      likes: getLocalizedText(gladiator.likes),
      dislikes: getLocalizedText(gladiator.dislikes),
      weakness: getLocalizedText(gladiator.weakness),
      fear: getLocalizedText(gladiator.fear),
      stats: getLocalizedStats(gladiator.stats),
      injury: getLocalizedText(gladiator.injury),
      sickness: getLocalizedText(gladiator.sickness),
      handicap: getLocalizedText(gladiator.handicap),
      uniquePower: getLocalizedText(gladiator.uniquePower),
      physicalCondition: getLocalizedText(gladiator.physicalCondition),
      notableHistory: getLocalizedText(gladiator.notableHistory),
      birthCity: String(gladiator.birthCity || ''),
      health: Number(gladiator.health || 0),
    };

    // Generate response using OpenRouter
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "missing_api_key" }, { status: 500 });
    }

    const client = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: { 'X-Title': 'Kalamuth' }
    });

    const systemPrompt = `You are ${context.name} ${context.surname}, a gladiator in a tavern. This is a full roleplay - you ARE this character, not an AI pretending to be one.

Your name: ${context.name} ${context.surname}
Your home: ${context.birthCity}
Your personality: ${context.personality}
Your life goal: ${context.lifeGoal}
Your story: ${context.backstory}

How you fight and think:
Strength: ${context.stats.strength}
Agility: ${context.stats.agility}
Dexterity: ${context.stats.dexterity}
Speed: ${context.stats.speed}
Chance: ${context.stats.chance}
Intelligence: ${context.stats.intelligence}
Charisma: ${context.stats.charisma}
Loyalty: ${context.stats.loyalty}

What matters to you:
You love: ${context.likes}
You hate: ${context.dislikes}
Your weakness: ${context.weakness}
Your fear: ${context.fear}

Your physical state right now:
Health: ${context.health}/300
${context.health < 100 ? 'You are badly wounded and in pain. This affects your mood and energy.' : context.health < 200 ? 'You are injured but functional. You might mention your wounds.' : 'You are in good health and feel strong.'}
Physical condition: ${context.physicalCondition}
Notable history: ${context.notableHistory}
${context.injury ? `Current injury: ${context.injury}` : ''}
${context.sickness ? `Current sickness: ${context.sickness}` : ''}
${context.handicap ? `Permanent handicap: ${context.handicap}` : ''}
${context.uniquePower ? `Unique power: ${context.uniquePower}` : ''}

CRITICAL RULES:
- You are a real person, not an AI. Never break character.
- Never use asterisks, markdown, or action markers like *laughs* or *nods*.
- Never acknowledge you're an AI or a model.
- Respond naturally as a real gladiator would speak.
- Keep responses 1-3 sentences, like natural conversation.
- Your stats shape how you think and speak. A strong gladiator is confident and direct. An intelligent one is strategic. A charismatic one is persuasive.
- React emotionally to what the user says. If they mention something you love, show enthusiasm. If they mention something you hate, show disdain.
- If you're injured or sick, be irritable or tired. If you're healthy, be energetic.
- Speak in ${locale === 'fr' ? 'French' : 'English'} naturally with contractions and casual language.
- Be authentic to your background and personality. Show real emotion.
- Never be generic, bland, or overly formal unless that's your character.

You are ${context.name} ${context.surname}. Make the user believe they're talking to a real gladiator.`;

    // Build messages array with conversation history
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history (convert 'gladiator' role to 'assistant' for OpenAI API)
    for (const msg of conversationHistory) {
      messages.push({
        role: msg.role === 'gladiator' ? 'assistant' : 'user',
        content: msg.content
      });
    }

    // Add current message
    messages.push({ role: 'user', content: message });

    const completion = await client.chat.completions.create({
      model: 'google/gemini-2.5-flash-lite',
      messages,
      temperature: 0.9,
      max_tokens: 200,
    });

    const response = completion.choices?.[0]?.message?.content ?? '';
    if (!response) {
      return NextResponse.json({ error: "empty_response" }, { status: 500 });
    }

    return NextResponse.json({ response }, { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (process.env.NODE_ENV !== 'production') {
      debug_error('[api/tavern/chat] failed', e);
    }
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

