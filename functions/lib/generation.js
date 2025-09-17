import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { defineSecret } from 'firebase-functions/params';
import OpenAI from 'openai';
import { db } from './admin.js';
import { MODEL_JSON_STRUCTURED } from './models.js';
import { FieldValue } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
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
            required: ['strength', 'agility', 'dexterity', 'speed', 'chance', 'intelligence', 'charisma', 'loyalty']
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
    required: ['name', 'surname', 'avatarUrl', 'health', 'alive', 'stats', 'lifeGoal', 'personality', 'backstory', 'weakness', 'fear', 'likes', 'dislikes', 'birthCity', 'physicalCondition', 'notableHistory'],
    allOf: [
        {
            if: { properties: { injury: { type: 'string', minLength: 1 } }, required: ['injury'] },
            then: { required: ['injuryTimeLeftHours'] }
        }
    ]
};
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
async function generateOneGladiator(client) {
    const completion = await client.chat.completions.create({
        model: MODEL_JSON_STRUCTURED,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Create one compliant gladiator.' }
        ],
        response_format: { type: 'json_schema', json_schema: { name: 'Gladiator', strict: true, schema: GladiatorJsonSchema } },
        temperature: 0.8
    });
    const choice = completion.choices?.[0];
    const choiceMessage = choice?.message;
    const content = typeof choiceMessage?.content === 'string' ? choiceMessage.content : '';
    const finishReason = choice?.finish_reason ?? null;
    const toolCallsCount = Array.isArray(choiceMessage?.tool_calls) ? choiceMessage?.tool_calls.length ?? 0 : 0;
    try {
        return JSON.parse(content);
    }
    catch (parseErr) {
        // Providers sometimes wrap JSON in fences
        const match = content.match(/```json\n([\s\S]*?)```/i) || content.match(/```([\s\S]*?)```/i);
        if (match)
            return JSON.parse(match[1]);
        // Log a safe preview of the invalid content for debugging
        const preview = content ? content.slice(0, 500) : '';
        logger.error('LLM did not return valid JSON', {
            error: parseErr instanceof Error ? parseErr.message : String(parseErr),
            contentPreview: preview,
            contentLength: content.length,
            finishReason,
            completionId: completion.id ?? null,
            usage: completion.usage ?? null,
            choiceRole: choiceMessage?.role ?? null,
            toolCallsCount,
        });
        throw new Error('LLM did not return valid JSON');
    }
}
export const onInitialGladiatorsJobCreated = onDocumentCreated({
    document: 'jobs/{jobId}',
    region: 'us-central1',
    timeoutSeconds: 540,
    secrets: [OPENROUTER_API_KEY]
}, async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const job = snap.data();
    if (!job || job.type !== 'generateInitialGladiators' || !job.ludusId || !job.count)
        return;
    // Structured log: job received
    logger.info('Initial gladiators job received', {
        jobId: event?.params?.jobId,
        ludusId: job.ludusId,
        userId: job.userId ?? null,
        serverId: job.serverId ?? null,
        requestedCount: job.count,
    });
    const client = new OpenAI({
        apiKey: OPENROUTER_API_KEY.value(),
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: { 'X-Title': 'Kalamuth' }
    });
    const gladiatorsCol = db.collection('gladiators');
    const ludusRef = db.collection('ludi').doc(job.ludusId);
    // Determine how many we actually need at this moment to avoid overshooting
    const existingSnap = await gladiatorsCol.where('ludusId', '==', job.ludusId).get();
    const existingCount = existingSnap.size;
    const minRequired = typeof job.minRequired === 'number' ? job.minRequired : job.count;
    const missing = Math.max(0, minRequired - existingCount);
    const toCreate = Math.min(job.count, missing);
    logger.info('Initial gladiators job capacity', {
        jobId: event?.params?.jobId,
        existingCount,
        minRequired,
        missing,
        toCreate,
    });
    if (toCreate <= 0) {
        logger.info('Nothing to create; job completes immediately', {
            jobId: event?.params?.jobId,
            existingCount,
            minRequired,
        });
        await snap.ref.set({ status: 'completed', created: 0, errors: [], finishedAt: FieldValue.serverTimestamp() }, { merge: true });
        return;
    }
    let created = 0;
    const errors = [];
    for (let i = 0; i < toCreate; i++) {
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
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            logger.error('Gladiator generation attempt failed', {
                jobId: event?.params?.jobId,
                attempt: i + 1,
                error: msg,
                stack: e instanceof Error ? e.stack : undefined,
            });
            errors.push(msg);
        }
    }
    try {
        if (created > 0) {
            await ludusRef.set({ gladiatorCount: created, updatedAt: new Date().toISOString() }, { merge: true });
        }
    }
    catch (err) {
        logger.error('Failed to update ludus gladiatorCount', {
            jobId: event?.params?.jobId,
            ludusId: job.ludusId,
            error: err instanceof Error ? err.message : String(err),
        });
        errors.push('Failed to update ludus gladiatorCount');
    }
    logger.info('Initial gladiators job finished', {
        jobId: event?.params?.jobId,
        created,
        errorsCount: errors.length,
        status: errors.length ? 'completed_with_errors' : 'completed',
    });
    await snap.ref.set({ status: errors.length ? 'completed_with_errors' : 'completed', created, errors, finishedAt: FieldValue.serverTimestamp() }, { merge: true });
});
