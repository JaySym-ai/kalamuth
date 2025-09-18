import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { defineSecret } from 'firebase-functions/params';
import OpenAI from 'openai';
import { db } from './admin.js';
import { MODEL_JSON_STRUCTURED } from './models.js';
import { FieldValue } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
function safeSerialize(value, maxLength = 4000) {
    try {
        const json = JSON.stringify(value);
        if (!json)
            return '';
        return json.length > maxLength ? `${json.slice(0, maxLength)}…` : json;
    }
    catch (err) {
        return `[unserializable:${err instanceof Error ? err.message : String(err)}]`;
    }
}
function extractApiErrorDetails(error) {
    const fallbackMessage = error instanceof Error ? error.message : String(error);
    if (!error || typeof error !== 'object') {
        return { status: null, code: null, type: null, message: fallbackMessage, raw: null };
    }
    const errObj = error;
    const response = errObj.response ?? undefined;
    const responseData = response?.data ?? undefined;
    const responseError = responseData?.error ?? errObj.error;
    const status = typeof errObj.status === 'number'
        ? errObj.status
        : typeof response?.status === 'number'
            ? response.status
            : typeof response?.statusCode === 'number'
                ? response.statusCode
                : null;
    const codeCandidate = responseError?.code ?? errObj.code;
    const code = typeof codeCandidate === 'string' || typeof codeCandidate === 'number' ? codeCandidate : null;
    const typeCandidate = responseError?.type ?? errObj.type;
    const type = typeof typeCandidate === 'string' ? typeCandidate : null;
    const messageCandidate = responseError?.message ?? fallbackMessage;
    const message = typeof messageCandidate === 'string' ? messageCandidate : fallbackMessage;
    const rawSource = responseData ?? responseError ?? null;
    return {
        status,
        code,
        type,
        message,
        raw: rawSource ? safeSerialize(rawSource) : null,
    };
}
function extractProviderErrorDetails(payload) {
    if (!payload || typeof payload !== 'object')
        return null;
    const base = payload;
    const providerError = base.error ?? base.provider_error ?? base.response?.error;
    if (!providerError || typeof providerError !== 'object') {
        const message = providerError != null ? String(providerError) : '';
        return message ? { message, code: null, raw: safeSerialize(providerError) } : null;
    }
    const errorObj = providerError;
    const codeCandidate = errorObj.code;
    const code = typeof codeCandidate === 'string' || typeof codeCandidate === 'number' ? codeCandidate : null;
    const messageCandidate = errorObj.message ?? errorObj.reason ?? errorObj.status ?? code ?? '[provider_error]';
    const message = typeof messageCandidate === 'string' || typeof messageCandidate === 'number'
        ? String(messageCandidate)
        : JSON.stringify(errorObj);
    return {
        message,
        code,
        raw: safeSerialize(providerError),
    };
}
const OPENROUTER_API_KEY = defineSecret('OPENROUTER_API_KEY');
const systemPromptBilingual = `detailed thinking off

You are generating gladiators for a Ludus management game with BILINGUAL content (English and French).
Respond with a single JSON object that matches this structure exactly (the values below are examples; replace them with new content, but keep the keys, casing, and types identical):

{
  "name": "Marcus Serpens",
  "surname": "Shadowstep",
  "avatarUrl": "",
  "health": 184,
  "alive": true,
  "injury": {
    "en": "Bruised ribs",
    "fr": "Côtes meurtries"
  },
  "injuryTimeLeftHours": 48,
  "sickness": {
    "en": "Fever",
    "fr": "Fièvre"
  },
  "stats": {
    "strength": {
      "en": "Drives forward with heavy, bone-rattling strikes that overwhelm guards.",
      "fr": "Avance avec des frappes lourdes et fracassantes qui submergent les gardes."
    },
    "agility": {
      "en": "Glides around blows with fluid hips and quick pivots, rarely losing balance.",
      "fr": "Glisse autour des coups avec des hanches fluides et des pivots rapides, perdant rarement l'équilibre."
    },
    "dexterity": {
      "en": "Spins the trident with surgeon-like precision, catching wrists and straps.",
      "fr": "Fait tournoyer le trident avec une précision chirurgicale, attrapant poignets et sangles."
    },
    "speed": {
      "en": "Explodes at the opening bell, closing distance before a shield can rise.",
      "fr": "Explose au son de la cloche, réduisant la distance avant qu'un bouclier ne se lève."
    },
    "chance": {
      "en": "Fortune seems to tip a blade his way; missteps turn into lucky recoveries.",
      "fr": "La fortune semble pencher la lame en sa faveur; les faux pas deviennent des récupérations chanceuses."
    },
    "intelligence": {
      "en": "Reads footwork early and baits feints, punishing telegraphed swings.",
      "fr": "Lit les mouvements de pieds tôt et appâte les feintes, punissant les coups télégraphiés."
    },
    "charisma": {
      "en": "Works the crowd with fearless posture and nods, rattling hesitant foes.",
      "fr": "Travaille la foule avec une posture intrépide et des hochements de tête, déstabilisant les adversaires hésitants."
    },
    "loyalty": {
      "en": "Keeps promises to his ludus and stands by stablemates when stakes rise.",
      "fr": "Tient ses promesses envers son ludus et soutient ses compagnons quand les enjeux montent."
    }
  },
  "lifeGoal": {
    "en": "Earn glory in the arena and secure freedom for his brother.",
    "fr": "Gagner la gloire dans l'arène et obtenir la liberté pour son frère."
  },
  "personality": {
    "en": "Cunning and precise, he watches patiently before striking.",
    "fr": "Rusé et précis, il observe patiemment avant de frapper."
  },
  "backstory": {
    "en": "Captured after a failed naval raid, he sold himself into the ludus to spare his crew.",
    "fr": "Capturé après un raid naval raté, il s'est vendu au ludus pour épargner son équipage."
  },
  "weakness": {
    "en": "Overthinks when pressured, costing him precious moments.",
    "fr": "Réfléchit trop sous pression, lui coûtant de précieux instants."
  },
  "fear": {
    "en": "Losing the loyalty of his fellow fighters.",
    "fr": "Perdre la loyauté de ses compagnons combattants."
  },
  "likes": {
    "en": "Sea voyages, chiseling marble, and quiet dawn meditations.",
    "fr": "Les voyages en mer, sculpter le marbre et les méditations silencieuses à l'aube."
  },
  "dislikes": {
    "en": "Chaotic commanders and needless cruelty.",
    "fr": "Les commandants chaotiques et la cruauté inutile."
  },
  "birthCity": "Halicara",
  "handicap": {
    "en": "Old spear wound stiffens his left wrist in cold weather.",
    "fr": "Une vieille blessure de lance raidit son poignet gauche par temps froid."
  },
  "uniquePower": {
    "en": "Once per bout he can sense the crowd's mood and recover a burst of morale.",
    "fr": "Une fois par combat, il peut sentir l'humeur de la foule et récupérer un regain de moral."
  },
  "physicalCondition": {
    "en": "Lean and wiry, with fresh bandages along his ribs.",
    "fr": "Mince et nerveux, avec des bandages frais le long de ses côtes."
  },
  "notableHistory": {
    "en": "Won a duel by predicting the opponent's every feint in a high-stakes exhibition.",
    "fr": "A gagné un duel en prédisant chaque feinte de l'adversaire lors d'une exhibition à enjeux élevés."
  }
}

Guidelines:
- Key names must match the example EXACTLY. Do not introduce or rename keys.
- Health must be an integer between 30 and 300.
- Each bilingual text field must have both "en" and "fr" keys with appropriate translations.
- Each stats.* value must be a non-empty textual description (1–2 sentences) in both languages.
- Narrative fields must each be a bilingual object with "en" and "fr" keys.
- "notableHistory" is always required with non-empty strings in both languages.
- If there is no injury, injuryTimeLeftHours, sickness, handicap, or uniquePower, omit the key entirely.
- The avatarUrl must remain exactly empty like that "".
- Use authentic ancient Mediterranean-inspired names (names and birthCity stay single language).
- Keep descriptions flavorful (1–4 sentences) and ensure French translations are natural and idiomatic.
- Output must be valid JSON with the exact casing shown.
`;
// Keep the old system prompt for backward compatibility
const systemPrompt = systemPromptBilingual;
const MAX_GENERATION_ATTEMPTS = 3;
const HEALTH_MIN = 30;
const HEALTH_MAX = 300;
const STAT_KEYS = ['strength', 'agility', 'dexterity', 'speed', 'chance', 'intelligence', 'charisma', 'loyalty'];
function expectNonEmptyString(value, field) {
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.length > 0) {
            return trimmed;
        }
    }
    throw new Error(`Field "${field}" must be a non-empty string`);
}
function expectStringAllowingEmpty(value, field) {
    if (value === undefined || value === null) {
        return '';
    }
    if (typeof value === 'string') {
        return value.trim();
    }
    throw new Error(`Field "${field}" must be a string or omitted`);
}
function expectBilingualText(value, field) {
    if (!value || typeof value !== 'object') {
        throw new Error(`Field "${field}" must be a bilingual object with 'en' and 'fr' keys`);
    }
    const obj = value;
    const en = expectNonEmptyString(obj.en, `${field}.en`);
    const fr = expectNonEmptyString(obj.fr, `${field}.fr`);
    return { en, fr };
}
function expectOptionalBilingualText(value, field) {
    if (value === undefined || value === null) {
        return undefined;
    }
    return expectBilingualText(value, field);
}
function expectOptionalString(value, field) {
    if (value === undefined || value === null) {
        return undefined;
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : undefined;
    }
    throw new Error(`Field "${field}" must be omitted or a non-empty string`);
}
function expectBoolean(value, field) {
    if (typeof value === 'boolean') {
        return value;
    }
    throw new Error(`Field "${field}" must be a boolean`);
}
function expectIntegerInRange(value, field, min, max) {
    const numeric = typeof value === 'number'
        ? value
        : typeof value === 'string'
            ? Number.parseInt(value, 10)
            : Number.NaN;
    if (!Number.isFinite(numeric)) {
        throw new Error(`Field "${field}" must be an integer between ${min} and ${max}`);
    }
    const rounded = Math.round(numeric);
    if (rounded < min || rounded > max) {
        throw new Error(`Field "${field}" must be between ${min} and ${max}`);
    }
    return rounded;
}
function normalizeBilingualGladiatorRaw(raw) {
    const name = expectNonEmptyString(raw.name, 'name');
    const surname = expectNonEmptyString(raw.surname, 'surname');
    const avatarUrl = expectStringAllowingEmpty(raw.avatarUrl, 'avatarUrl');
    if (avatarUrl !== '' && avatarUrl !== 'https://placehold.co/256x256?text=Gladiator') {
        throw new Error('Field "avatarUrl" must be empty string or "https://placehold.co/256x256?text=Gladiator"');
    }
    const health = expectIntegerInRange(raw.health, 'health', HEALTH_MIN, HEALTH_MAX);
    const alive = expectBoolean(raw.alive, 'alive');
    const statsSource = (raw.stats ?? raw.statistics);
    if (!statsSource || typeof statsSource !== 'object') {
        throw new Error('Field "stats" must be an object containing all stat fields');
    }
    const statsRecord = statsSource;
    const stats = STAT_KEYS.reduce((acc, key) => {
        acc[key] = expectBilingualText(statsRecord[key], `stats.${key}`);
        return acc;
    }, {});
    const lifeGoal = expectBilingualText(raw.lifeGoal, 'lifeGoal');
    const personality = expectBilingualText(raw.personality, 'personality');
    const backstory = expectBilingualText(raw.backstory, 'backstory');
    const weakness = expectBilingualText(raw.weakness, 'weakness');
    const fear = expectBilingualText(raw.fear, 'fear');
    const likes = expectBilingualText(raw.likes, 'likes');
    const dislikes = expectBilingualText(raw.dislikes, 'dislikes');
    const birthCity = expectNonEmptyString(raw.birthCity, 'birthCity');
    const physicalCondition = expectBilingualText(raw.physicalCondition, 'physicalCondition');
    const notableHistory = expectBilingualText(raw.notableHistory, 'notableHistory');
    const injury = expectOptionalBilingualText(raw.injury, 'injury');
    const sickness = expectOptionalBilingualText(raw.sickness, 'sickness');
    const handicap = expectOptionalBilingualText(raw.handicap, 'handicap');
    const uniquePower = expectOptionalBilingualText(raw.uniquePower, 'uniquePower');
    let injuryTimeLeftHours;
    if (injury) {
        injuryTimeLeftHours = expectIntegerInRange(raw.injuryTimeLeftHours, 'injuryTimeLeftHours', 1, 24 * 30);
    }
    else if (raw.injuryTimeLeftHours !== undefined && raw.injuryTimeLeftHours !== null) {
        throw new Error('Omit "injuryTimeLeftHours" when there is no injury');
    }
    return {
        name,
        surname,
        avatarUrl: avatarUrl || 'https://placehold.co/256x256?text=Gladiator',
        health,
        alive,
        ...(injury ? { injury } : {}),
        ...(injuryTimeLeftHours ? { injuryTimeLeftHours } : {}),
        ...(sickness ? { sickness } : {}),
        stats,
        lifeGoal,
        personality,
        backstory,
        weakness,
        fear,
        likes,
        dislikes,
        birthCity,
        ...(handicap ? { handicap } : {}),
        ...(uniquePower ? { uniquePower } : {}),
        physicalCondition,
        notableHistory,
    };
}
function normalizeGeneratedGladiatorRaw(raw) {
    const name = expectNonEmptyString(raw.name, 'name');
    const surname = expectNonEmptyString(raw.surname, 'surname');
    const rawAvatarUrl = expectStringAllowingEmpty(raw.avatarUrl, 'avatarUrl');
    if (rawAvatarUrl !== '' && rawAvatarUrl !== 'https://placehold.co/256x256?text=Gladiator') {
        throw new Error('Field "avatarUrl" must be empty string or "https://placehold.co/256x256?text=Gladiator"');
    }
    const avatarUrl = rawAvatarUrl || 'https://placehold.co/256x256?text=Gladiator';
    const health = expectIntegerInRange(raw.health, 'health', HEALTH_MIN, HEALTH_MAX);
    const alive = expectBoolean(raw.alive, 'alive');
    const statsSource = (raw.stats ?? raw.statistics);
    if (!statsSource || typeof statsSource !== 'object') {
        throw new Error('Field "stats" must be an object containing all stat fields');
    }
    const statsRecord = statsSource;
    const stats = STAT_KEYS.reduce((acc, key) => {
        acc[key] = expectNonEmptyString(statsRecord[key], `stats.${key}`);
        return acc;
    }, {});
    const lifeGoal = expectNonEmptyString(raw.lifeGoal, 'lifeGoal');
    const personality = expectNonEmptyString(raw.personality, 'personality');
    const backstory = expectNonEmptyString(raw.backstory, 'backstory');
    const weakness = expectNonEmptyString(raw.weakness, 'weakness');
    const fear = expectNonEmptyString(raw.fear, 'fear');
    const likes = expectNonEmptyString(raw.likes, 'likes');
    const dislikes = expectNonEmptyString(raw.dislikes, 'dislikes');
    const birthCity = expectNonEmptyString(raw.birthCity, 'birthCity');
    const physicalCondition = expectNonEmptyString(raw.physicalCondition, 'physicalCondition');
    const notableHistory = expectNonEmptyString(raw.notableHistory, 'notableHistory');
    const injury = expectOptionalString(raw.injury, 'injury');
    const sickness = expectOptionalString(raw.sickness, 'sickness');
    const handicap = expectOptionalString(raw.handicap, 'handicap');
    const uniquePower = expectOptionalString(raw.uniquePower, 'uniquePower');
    let injuryTimeLeftHours;
    if (injury) {
        injuryTimeLeftHours = expectIntegerInRange(raw.injuryTimeLeftHours, 'injuryTimeLeftHours', 1, 24 * 30);
    }
    else if (raw.injuryTimeLeftHours !== undefined && raw.injuryTimeLeftHours !== null) {
        throw new Error('Omit "injuryTimeLeftHours" when there is no injury');
    }
    return {
        name,
        surname,
        avatarUrl,
        health,
        alive,
        ...(injury ? { injury } : {}),
        ...(injuryTimeLeftHours ? { injuryTimeLeftHours } : {}),
        ...(sickness ? { sickness } : {}),
        stats,
        lifeGoal,
        personality,
        backstory,
        weakness,
        fear,
        likes,
        dislikes,
        birthCity,
        ...(handicap ? { handicap } : {}),
        ...(uniquePower ? { uniquePower } : {}),
        physicalCondition,
        notableHistory,
    };
}
async function generateOneGladiator(client, context) {
    let lastError = null;
    for (let generationAttempt = 1; generationAttempt <= MAX_GENERATION_ATTEMPTS; generationAttempt++) {
        let completion;
        try {
            const request = {
                model: MODEL_JSON_STRUCTURED,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: 'Create one compliant gladiator.' }
                ],
                response_format: { type: 'json_object' },
                temperature: 0.7,
            };
            request.include_reasoning = false;
            completion = (await client.chat.completions.create(request));
        }
        catch (err) {
            const details = extractApiErrorDetails(err);
            logger.error('OpenRouter transport error', {
                jobId: context?.jobId ?? null,
                attempt: context?.attempt ?? null,
                generationAttempt,
                model: MODEL_JSON_STRUCTURED,
                status: details.status,
                code: details.code ?? null,
                type: details.type,
                message: details.message,
                rawError: details.raw,
            });
            lastError = err instanceof Error ? err : new Error(details.message || 'OpenRouter transport error');
            continue;
        }
        const choice = completion.choices?.[0];
        const choiceMessage = choice?.message;
        const content = typeof choiceMessage?.content === 'string' ? choiceMessage.content : '';
        const finishReason = choice?.finish_reason ?? null;
        const toolCallsCount = Array.isArray(choiceMessage?.tool_calls) ? choiceMessage.tool_calls.length : 0;
        const reasoningText = choiceMessage && typeof choiceMessage.reasoning === 'string'
            ? choiceMessage.reasoning
            : null;
        const reasoningDetails = choiceMessage?.reasoning_details ? safeSerialize(choiceMessage.reasoning_details) : null;
        const providerError = extractProviderErrorDetails(completion);
        if (!content && providerError) {
            logger.error('OpenRouter provider error', {
                jobId: context?.jobId ?? null,
                attempt: context?.attempt ?? null,
                generationAttempt,
                completionId: completion.id ?? null,
                providerErrorCode: providerError.code,
                providerError: providerError.raw,
            });
            lastError = new Error(`Provider error: ${providerError.message}`);
            continue;
        }
        if (!content) {
            logger.error('LLM returned empty content', {
                jobId: context?.jobId ?? null,
                attempt: context?.attempt ?? null,
                generationAttempt,
                completionId: completion.id ?? null,
                finishReason,
                reasoning: reasoningText ? reasoningText.slice(0, 500) : null,
                reasoningDetails,
                rawChoice: safeSerialize(choice),
                rawCompletion: safeSerialize(completion),
            });
            lastError = new Error('Provider returned empty content');
            continue;
        }
        let parsed;
        try {
            parsed = JSON.parse(content);
        }
        catch (parseErr) {
            const fencedMatch = content.match(/```json\n([\s\S]*?)```/i) || content.match(/```([\s\S]*?)```/i);
            if (fencedMatch) {
                try {
                    parsed = JSON.parse(fencedMatch[1]);
                }
                catch (innerErr) {
                    logger.error('LLM fenced JSON parse failed', {
                        jobId: context?.jobId ?? null,
                        attempt: context?.attempt ?? null,
                        generationAttempt,
                        error: innerErr instanceof Error ? innerErr.message : String(innerErr),
                        rawSnippetLength: fencedMatch[1]?.length ?? 0,
                    });
                    lastError = innerErr instanceof Error ? innerErr : new Error(String(innerErr));
                    continue;
                }
            }
            else {
                logger.error('LLM did not return valid JSON', {
                    jobId: context?.jobId ?? null,
                    attempt: context?.attempt ?? null,
                    generationAttempt,
                    error: parseErr instanceof Error ? parseErr.message : String(parseErr),
                    contentPreview: content.slice(0, 500),
                    contentLength: content.length,
                    finishReason,
                    completionId: completion.id ?? null,
                    usage: completion.usage ?? null,
                    choiceRole: choiceMessage?.role ?? null,
                    toolCallsCount,
                    reasoning: reasoningText ? reasoningText.slice(0, 500) : null,
                    reasoningDetails,
                    rawChoice: safeSerialize(choice),
                    rawCompletion: safeSerialize(completion),
                });
                lastError = parseErr instanceof Error ? parseErr : new Error(String(parseErr));
                continue;
            }
        }
        try {
            // Try to detect if this is bilingual data
            const parsedObj = parsed;
            const lifeGoalCandidate = typeof parsedObj.lifeGoal === 'object' && parsedObj.lifeGoal !== null
                ? parsedObj.lifeGoal
                : null;
            const isBilingual = typeof lifeGoalCandidate?.['en'] === 'string' &&
                typeof lifeGoalCandidate?.['fr'] === 'string';
            if (isBilingual) {
                // Handle bilingual gladiator
                const bilingualGladiator = normalizeBilingualGladiatorRaw(parsedObj);
                return bilingualGladiator;
            }
            else {
                // Handle legacy single-language gladiator
                const gladiator = normalizeGeneratedGladiatorRaw(parsedObj);
                return gladiator;
            }
        }
        catch (validationErr) {
            logger.error('Generated gladiator failed validation', {
                jobId: context?.jobId ?? null,
                attempt: context?.attempt ?? null,
                generationAttempt,
                completionId: completion.id ?? null,
                error: validationErr instanceof Error ? validationErr.message : String(validationErr),
                rawGladiator: safeSerialize(parsed),
            });
            lastError = validationErr instanceof Error ? validationErr : new Error(String(validationErr));
            continue;
        }
    }
    if (lastError instanceof Error) {
        throw lastError;
    }
    throw new Error('Failed to generate gladiator after multiple attempts');
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
            const g = await generateOneGladiator(client, {
                jobId: event?.params?.jobId,
                attempt: i + 1,
            });
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
