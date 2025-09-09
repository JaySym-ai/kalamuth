import "server-only";
import OpenAI from "openai";

export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

/**
 * Shared OpenRouter client (server-only). Set OPENROUTER_API_KEY in your env.
 * Optionally set NEXT_PUBLIC_SITE_URL to appear in OpenRouter rankings.
 */
export const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: OPENROUTER_BASE_URL,
  defaultHeaders: {
    ...(process.env.NEXT_PUBLIC_SITE_URL
      ? { "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL }
      : {}),
    "X-Title": "Kalamuth",
  },
});

export function ensureOpenRouterKey() {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error(
      "Missing OPENROUTER_API_KEY. Add it to .env.local and restart the dev server."
    );
  }
}

