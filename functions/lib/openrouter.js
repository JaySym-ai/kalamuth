import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import OpenAI from 'openai';
import * as logger from 'firebase-functions/logger';
const OPENROUTER_API_KEY = defineSecret('OPENROUTER_API_KEY');
export const proxyOpenRouter = onCall({
    region: 'us-central1',
    secrets: [OPENROUTER_API_KEY],
    enforceAppCheck: true,
    invoker: 'public',
    timeoutSeconds: 540,
}, async (request) => {
    const { model, messages, schema, seed, temperature } = request.data || {};
    if (!Array.isArray(messages) || !schema) {
        throw new HttpsError('invalid-argument', 'Invalid payload: messages (array) and schema (object) are required.');
    }
    const modelToUse = typeof model === 'string' && model.length > 0 ? model : 'nvidia/nemotron-nano-9b-v2:free';
    const temperatureValue = typeof temperature === 'number' ? temperature : 0.8;
    const messagesCount = messages.length;
    logger.info('proxyOpenRouter request', {
        model: modelToUse,
        seed: seed ?? null,
        temperature: temperatureValue,
        messagesCount,
    });
    const client = new OpenAI({
        apiKey: OPENROUTER_API_KEY.value(),
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: { 'X-Title': 'Kalamuth' },
    });
    try {
        const completion = await client.chat.completions.create({
            model: modelToUse,
            messages,
            response_format: {
                type: 'json_schema',
                json_schema: { name: 'Gladiator', strict: true, schema },
            },
            seed,
            temperature: temperatureValue,
        });
        logger.info('proxyOpenRouter completion', {
            id: completion.id ?? null,
            finishReason: completion.choices?.[0]?.finish_reason ?? null,
            usage: completion.usage ?? null,
            choicesCount: completion.choices?.length ?? 0,
        });
        const content = completion.choices?.[0]?.message?.content || '';
        logger.info('proxyOpenRouter response', { contentLength: content.length });
        return { content };
    }
    catch (err) {
        logger.error('proxyOpenRouter failed', {
            model: modelToUse,
            temperature: temperatureValue,
            seed: seed ?? null,
            error: err instanceof Error ? err.message : String(err),
        });
        throw err;
    }
});
