import OpenAI from "openai";

/**
 * Get an OpenRouter client instance
 * @throws Error if OPENROUTER_API_KEY is not set
 */
export function getOpenRouterClient(timeout = 60000): OpenAI {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("missing_openrouter_api_key");
  }

  return new OpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: { 'X-Title': 'Kalamuth' },
    timeout,
  });
}
