import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import OpenAI from 'openai';
import * as logger from 'firebase-functions/logger';



function safeSerialize(value: unknown, maxLength = 4000) {
  try {
    const json = JSON.stringify(value);
    if (!json) return '';
    return json.length > maxLength ? `${json.slice(0, maxLength)}…` : json;
  } catch (err) {
    return `[unserializable:${err instanceof Error ? err.message : String(err)}]`;
  }
}

type LoggedError = Error & { __logged?: boolean };

type ApiErrorDetails = {
  status: number | null;
  code: string | number | null;
  type: string | null;
  message: string;
  raw: string | null;
};

function markAsLogged<T extends Error>(error: T): T {
  (error as LoggedError).__logged = true;
  return error;
}

function hasBeenLogged(error: unknown): error is LoggedError {
  return Boolean(error && typeof error === 'object' && '__logged' in error && (error as LoggedError).__logged);
}

function extractApiErrorDetails(error: unknown): ApiErrorDetails {
  const fallbackMessage = error instanceof Error ? error.message : String(error);
  if (!error || typeof error !== 'object') {
    return { status: null, code: null, type: null, message: fallbackMessage, raw: null };
  }

  const errObj = error as Record<string, unknown> & { response?: Record<string, unknown> };
  const response = (errObj.response as Record<string, unknown> | undefined) ?? undefined;
  const responseData = (response?.data as Record<string, unknown> | undefined) ?? undefined;
  const responseError = (responseData?.error as Record<string, unknown> | undefined) ?? (errObj.error as Record<string, unknown> | undefined);

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

function extractProviderErrorDetails(payload: unknown): { message: string; code: string | number | null; raw: string | null } | null {
  if (!payload || typeof payload !== 'object') return null;
  const base = payload as Record<string, unknown>;
  const providerError = (base.error as unknown) ?? (base.provider_error as unknown) ?? ((base.response as Record<string, unknown> | undefined)?.error as unknown);
  if (!providerError || typeof providerError !== 'object') {
    const message = providerError != null ? String(providerError) : '';
    return message ? { message, code: null, raw: safeSerialize(providerError) } : null;
  }

  const errorObj = providerError as Record<string, unknown>;
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

export const proxyOpenRouter = onCall(
  {
    region: 'us-central1',
    secrets: [OPENROUTER_API_KEY],
    enforceAppCheck: true,
    invoker: 'public',
    timeoutSeconds: 540,
  },
  async (request) => {
    const { model, messages, schema, seed, temperature } = request.data || {};

    if (!Array.isArray(messages) || !schema) {
      throw new HttpsError(
        'invalid-argument',
        'Invalid payload: messages (array) and schema (object) are required.'
      );
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

    let completion: OpenAI.Chat.Completions.ChatCompletion;
    try {
      completion = await client.chat.completions.create({
        model: modelToUse,
        messages,
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'Gladiator', strict: true, schema },
        },
        seed,
        temperature: temperatureValue,
      });
    } catch (err) {
      const details = extractApiErrorDetails(err);
      logger.error('proxyOpenRouter transport error', {
        model: modelToUse,
        temperature: temperatureValue,
        seed: seed ?? null,
        status: details.status,
        code: details.code ?? null,
        type: details.type,
        message: details.message,
        rawError: details.raw,
      });
      if (err instanceof Error) {
        throw markAsLogged(err);
      }
      throw markAsLogged(new HttpsError('internal', details.message || 'OpenRouter request failed'));
    }

    try {
      const primaryChoice = completion.choices?.[0];
      const message = primaryChoice?.message as {
        role?: string;
        content?: string;
        tool_calls?: unknown[];
        reasoning?: unknown;
        reasoning_details?: unknown;
      } | undefined;
      const content = typeof message?.content === 'string' ? message.content : '';
      const reasoning = message && typeof message.reasoning === 'string' ? message.reasoning : null;
      const reasoningDetails = message?.reasoning_details ? safeSerialize(message.reasoning_details) : null;

      logger.info('proxyOpenRouter completion', {
        id: completion.id ?? null,
        finishReason: primaryChoice?.finish_reason ?? null,
        usage: completion.usage ?? null,
        choicesCount: completion.choices?.length ?? 0,
        messageRole: message?.role ?? null,
        toolCallsCount: Array.isArray(message?.tool_calls) ? message.tool_calls.length : 0,
        hasReasoning: Boolean(reasoning),
      });

      const providerError = extractProviderErrorDetails(completion);
      if (!content && providerError) {
        logger.error('proxyOpenRouter provider error', {
          model: modelToUse,
          completionId: completion.id ?? null,
          providerErrorCode: providerError.code,
          providerError: providerError.raw,
        });
        throw markAsLogged(new HttpsError('failed-precondition', `Provider error: ${providerError.message}`));
      }

      if (!content) {
        logger.warn('proxyOpenRouter returned empty content', {
          id: completion.id ?? null,
          finishReason: primaryChoice?.finish_reason ?? null,
          usage: completion.usage ?? null,
          reasoning: reasoning ? reasoning.slice(0, 500) : null,
          reasoningDetails,
          rawChoice: safeSerialize(primaryChoice),
          rawCompletion: safeSerialize(completion),
        });
      }

      logger.info('proxyOpenRouter response', { contentLength: content.length });
      return { content };
    } catch (err) {
      if (hasBeenLogged(err)) {
        throw err as LoggedError;
      }
      const details = extractApiErrorDetails(err);
      logger.error('proxyOpenRouter failed', {
        model: modelToUse,
        temperature: temperatureValue,
        seed: seed ?? null,
        status: details.status,
        code: details.code ?? null,
        type: details.type,
        message: details.message,
        rawError: details.raw,
      });
      throw err;
    }

  }
);

