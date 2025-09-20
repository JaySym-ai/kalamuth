import "server-only";

import { Gladiator } from "@/types/gladiator";
import {
  GladiatorZ,
  OpenRouterGladiatorJsonSchema,
  makeGladiatorArrayJsonSchema,
} from "@/lib/gladiator/schema";
import { openrouter, ensureOpenRouterKey } from "@/lib/ai/openrouter";


export type GenerateOptions = {
  seed?: number;
  temperature?: number;
  retry?: number; // number of LLM repair retries on validation failure
};


const systemPrompt = `
You are generating gladiators for a Ludus management game.
Follow the provided JSON Schema exactly. Do not include any fields not in the schema.
- "health" represents max health (HP cap) and must be an integer between 30 and 300.
- "stats" fields (strength, agility, dexterity, speed, chance, intelligence, charisma, loyalty) must each be a 1–2 sentence descriptive string about how the gladiator expresses that trait in combat and behavior. Do not return numeric ratings for these.
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


const MODEL_JSON_STRUCTURED = "nvidia/nemotron-nano-9b-v2:free";

async function llmGenerateRaw(
  messages: { role: "system" | "user"; content: string }[],
  schema: Record<string, unknown>,
  opts: GenerateOptions
) {
  ensureOpenRouterKey();
  const completion = await openrouter.chat.completions.create({
    model: MODEL_JSON_STRUCTURED,
    messages,
    response_format: {
      type: "json_schema",
      json_schema: { name: "Gladiator", strict: true, schema },
    },
    seed: opts.seed,
    temperature: opts.temperature ?? 0.8,
  });
  const content = completion.choices?.[0]?.message?.content ?? "";
  if (!content) {
    throw new Error("OpenRouter returned empty content");
  }
  return content;
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