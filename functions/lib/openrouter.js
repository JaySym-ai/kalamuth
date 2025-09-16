import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import OpenAI from 'openai';
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
    const client = new OpenAI({
        apiKey: OPENROUTER_API_KEY.value(),
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: { 'X-Title': 'Kalamuth' },
    });
    const completion = await client.chat.completions.create({
        model: typeof model === 'string' && model.length > 0 ? model : 'nvidia/nemotron-nano-9b-v2:free',
        messages,
        response_format: {
            type: 'json_schema',
            json_schema: { name: 'Gladiator', strict: true, schema },
        },
        seed,
        temperature: typeof temperature === 'number' ? temperature : 0.8,
    });
    const content = completion.choices?.[0]?.message?.content || '';
    return { content };
});
