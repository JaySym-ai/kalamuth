import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { defineSecret } from 'firebase-functions/params';
import OpenAI from 'openai';
import { db } from './admin';
import { MODEL_JSON_STRUCTURED } from './models';


const OPENROUTER_API_KEY = defineSecret('OPENROUTER_API_KEY');

// Strict JSON schema for a single Gladiator (kept in sync with web app schema)
const GladiatorJsonSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    surname: { type: 'string', minLength: 1 },
    avatarUrl: { type: 'string', format: 'uri' },
    health: { type: 'integer', minimum: 30, maximum: 300 },
    alive: { type: 'boolean' },
    injury: { type: 'string', minLength: 1 },
    injuryTimeLeftHours: { type: 'integer', minimum: 1 },
    sickness: { type: 'string', minLength: 1 },
    stats: {
      type: 'object',
      properties: {
        strength: { type: 'integer', minimum: 10, maximum: 100 },
        agility: { type: 'integer', minimum: 10, maximum: 100 },
        dexterity: { type: 'integer', minimum: 10, maximum: 100 },
        speed: { type: 'integer', minimum: 10, maximum: 100 },
        chance: { type: 'integer', minimum: 10, maximum: 100 },
        intelligence: { type: 'integer', minimum: 10, maximum: 100 },
        charisma: { type: 'integer', minimum: 10, maximum: 100 },
        loyalty: { type: 'integer', minimum: 10, maximum: 100 }
      },
      required: ['strength','agility','dexterity','speed','chance','intelligence','charisma','loyalty']
    },
    lifeGoal: { type: 'string', minLength: 1 },
    personality: { type: 'string', minLength: 1 },
    backstory: { type: 'string', minLength: 1 },
    weakness: { type: 'string', minLength: 1 },
    fear: { type: 'string', minLength: 1 },
    likes: { type: 'string', minLength: 1 },
    dislikes: { type: 'string', minLength: 1 },
    birthCity: { type: 'string', minLength: 1 },
    handicap: { type: 'string', minLength: 1 },
    uniquePower: { type: 'string', minLength: 1 },
    physicalCondition: { type: 'string', minLength: 1 },
    notableHistory: { type: 'string', minLength: 1 }
  },
  required: ['name','surname','avatarUrl','health','alive','stats','lifeGoal','personality','backstory','weakness','fear','likes','dislikes','birthCity','physicalCondition','notableHistory'],
  allOf: [
    {
      if: { properties: { injury: { type: 'string', minLength: 1 } }, required: ['injury'] },
      then: { required: ['injuryTimeLeftHours'] }
    }
  ]
} as const;

const systemPrompt = `
You are generating gladiators for a Ludus management game.
Follow the provided JSON Schema exactly. Do not include any fields not in the schema.
- Numbers must be integers and within their specified bounds.
- "health" represents max health (HP cap), not current health.
- Keep narrative fields vivid but concise (1 to 3 sentences each), suitable for in-game use.
- The uniquePower must be subtle and not overpowered; it's optional.
- If injury is present, injuryTimeLeftHours must be an integer >= 1.
- Use realistic ancient/mediterranean naming, but creativity is welcome.
- The avatarUrl is a placeholder for now put "https://placehold.co/256x256?text=Gladiator".
Return only JSON matching the schema.
`;

async function generateOneGladiator(client: OpenAI) {
  const completion = await client.chat.completions.create({
    model: MODEL_JSON_STRUCTURED,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Create one compliant gladiator.' }
    ],
    response_format: { type: 'json_schema', json_schema: { name: 'Gladiator', strict: true, schema: GladiatorJsonSchema } },
    temperature: 0.8
  });
  const content = completion.choices?.[0]?.message?.content || '';
  try {
    return JSON.parse(content);
  } catch {
    // Providers sometimes wrap JSON in fences
    const match = content.match(/```json\n([\s\S]*?)```/i) || content.match(/```([\s\S]*?)```/i);
    if (match) return JSON.parse(match[1]!);
    throw new Error('LLM did not return valid JSON');
  }
}

export const onInitialGladiatorsJobCreated = onDocumentCreated(
  {
    document: 'jobs/generateInitialGladiators/{jobId}',
    region: 'us-central1',
    timeoutSeconds: 540,
    secrets: [OPENROUTER_API_KEY]
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const job = snap.data() as { ludusId: string; serverId?: string; userId?: string; count: number } | undefined;
    if (!job || !job.ludusId || !job.count) return;

    const client = new OpenAI({
      apiKey: OPENROUTER_API_KEY.value(),
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: { 'X-Title': 'Kalamuth' }
    });

    const gladiatorsCol = db.collection('gladiators');
    const ludusRef = db.collection('ludi').doc(job.ludusId);

    let created = 0;
    const errors: string[] = [];

    for (let i = 0; i < job.count; i++) {
      try {
        const g = await generateOneGladiator(client);
        const now = new Date().toISOString();
        await gladiatorsCol.add({
          ...g,
          ludusId: job.ludusId,
          serverId: job.serverId || null,
          createdAt: now,
          updatedAt: now
        });
        created++;
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e));
      }
    }

    try {
      if (created > 0) {
        await ludusRef.set({ gladiatorCount: created, updatedAt: new Date().toISOString() }, { merge: true });
      }
    } catch (e) {
      errors.push('Failed to update ludus gladiatorCount');
    }

    await snap.ref.set({ status: errors.length ? 'completed_with_errors' : 'completed', created, errors, finishedAt: new Date().toISOString() }, { merge: true });
  }
);

