import "server-only";

import { Gladiator } from "@/types/gladiator";
import {
  GladiatorZ,
  OpenRouterGladiatorJsonSchema,
  makeGladiatorArrayJsonSchema,
} from "@/lib/gladiator/schema";

export type GenerateOptions = {
  model?: string; // Default below
  seed?: number;

  temperature?: number;
  retry?: number; // number of LLM repair retries on validation failure
};

const DEFAULT_MODEL = "nvidia/nemotron-nano-9b-v2:free"; // Change as desired on OpenRouter

const systemPrompt = `
You are generating gladiators for a Ludus management game.
Follow the provided JSON Schema exactly. Do not include any fields not in the schema.
- Numbers must be integers and within their specified bounds.
- "health" represents max health (HP cap), not current health.
- Keep narrative fields vivid but concise (1-2 sentences each), suitable for in-game use.
- The uniquePower must be subtle and not overpowered; it's optional.
- If injury is present, injuryTimeLeftHours must be an integer >= 1.
- Use realistic ancient/mediterranean naming, but creativity is welcome.
- avatarUrl must be a valid URL (can be placeholder).
Return only JSON matching the schema.
`;

function buildUserPrompt(single: boolean, count?: number) {
  if (single) return "Create one compliant gladiator.";
  return `Create ${count} distinct, compliant gladiators.`;
}

function parseContent<T>(content: string): T {
  try {
    return JSON.parse(content) as T;
  } catch (e) {
    // Some providers may wrap content in code fences; try to extract
    const match = content.match(/```json\n([\s\S]*?)```/i) || content.match(/```([\s\S]*?)```/i);
    if (match) return JSON.parse(match[1]) as T;
    throw e;
  }
}

async function llmGenerateRaw(
  messages: { role: "system" | "user"; content: string }[],
  schema: Record<string, unknown>,
  opts: GenerateOptions
) {
  const base = process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL;
  if (!base) {
    throw new Error("Missing NEXT_PUBLIC_FUNCTIONS_BASE_URL. Set it to your Cloud Functions base URL, e.g. https://us-central1-<project-id>.cloudfunctions.net");
  }
  const payload: any = {
    model: opts.model || DEFAULT_MODEL,
    messages,
    schema,
    seed: opts.seed,
    temperature: opts.temperature ?? 0.8,
  };

  const res = await fetch(`${base}/proxyOpenRouter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Firebase Function proxyOpenRouter failed: ${res.status} ${text}`);
  }
  const json = (await res.json()) as { content?: string };
  return json.content || "";
}

export async function generateGladiator(opts: GenerateOptions = {}): Promise<Gladiator> {
  const messages = [
    { role: "system" as const, content: systemPrompt },
    { role: "user" as const, content: buildUserPrompt(true) },
  ];

  const schema = OpenRouterGladiatorJsonSchema;
  let attempts = (opts.retry ?? 1) + 1;


  while (attempts-- > 0) {
    try {
      const content = await llmGenerateRaw(messages, schema, opts);
      const obj = parseContent<unknown>(content);
      return GladiatorZ.parse(obj) as Gladiator;
    } catch (e) {

      // Provide a repair message with error summary and retry once
      if (attempts > 0) {
        const errorSummary = e instanceof Error ? e.message : String(e);
        messages.push({
          role: "user",
          content:
            "Validation failed. Repair strictly to match the schema and bounds. Error: " +
            errorSummary,
        });
      }
    }
  }

  // No fallback - throw error if AI generation fails
  throw new Error("Failed to generate gladiator using AI LLM after all retry attempts");
}

export async function generateGladiators(count: number, opts: GenerateOptions = {}): Promise<Gladiator[]> {
  const messages = [
    { role: "system" as const, content: systemPrompt },
    { role: "user" as const, content: buildUserPrompt(false, count) },
  ];
  const arraySchema = makeGladiatorArrayJsonSchema(count);

  let attempts = (opts.retry ?? 1) + 1;


  while (attempts-- > 0) {
    try {
      const content = await llmGenerateRaw(messages, arraySchema, opts);
      const arr = parseContent<unknown>(content);
      // Validate array elements
      const parsed = (Array.isArray(arr) ? arr : [])
        .map((g) => GladiatorZ.parse(g) as Gladiator);
      if (parsed.length !== count) throw new Error("Incorrect cardinality returned");
      return parsed;
    } catch (e) {

      if (attempts > 0) {
        const errorSummary = e instanceof Error ? e.message : String(e);
        messages.push({
          role: "user",
          content:
            `Validation failed for array of ${count}. Repair strictly to match the schema and bounds. Error: ` +
            errorSummary,
        });
      }
    }
  }

  // No fallback - throw error if AI generation fails
  throw new Error(`Failed to generate ${count} gladiators using AI LLM after all retry attempts`);
}