import "server-only";

import { Gladiator, GladiatorRarity } from "@/types/gladiator";
import {
  GladiatorZ,
  OpenRouterGladiatorJsonSchema,
  makeGladiatorArrayJsonSchema,
} from "@/lib/gladiator/schema";
import { openrouter, ensureOpenRouterKey } from "@/lib/ai/openrouter";
import { rollRarity, getRarityLabel } from "@/lib/gladiator/rarity";
import type { RarityConfig } from "@/types/server";


export type GenerateOptions = {
  seed?: number;
  temperature?: number;
  retry?: number; // number of LLM repair retries on validation failure
  rarityConfig?: RarityConfig; // rarity percentage configuration
  preRolledRarity?: GladiatorRarity; // pre-rolled rarity (for testing or specific generation)
};


function buildSystemPrompt(rarityInfo?: string): string {
  return `
You are generating gladiators for a Ludus management game with BILINGUAL content (English and French).
Follow the provided JSON Schema exactly. Do not include any fields not in the schema.
- "health" represents max health (HP cap) and must be an integer between 30 and 300.
- "rarity" must be one of: bad, common, uncommon, rare, epic, legendary, unique. This is hidden from players but affects generation.
- "stats" fields (strength, agility, dexterity, speed, chance, intelligence, charisma, loyalty) must each be a bilingual object with "en" and "fr" keys, containing 1–2 sentence descriptive strings about how the gladiator expresses that trait in combat and behavior. Do not return numeric ratings.
- All narrative fields (lifeGoal, personality, backstory, weakness, fear, likes, dislikes, physicalCondition, notableHistory) must be bilingual objects with "en" and "fr" keys. Keep descriptions vivid but concise (1-2 sentences each), suitable for in-game use.
- Optional fields (injury, sickness, handicap, uniquePower) must also be bilingual objects if included.
- The uniquePower must be subtle and not overpowered; it's optional.
- If injury is present, injuryTimeLeftHours must be an integer >= 1.
- Use realistic ancient/mediterranean naming, but creativity is welcome.
- Within a single generation request, each gladiator's name + surname combination must be unique.
- avatarUrl must be a valid URL (can be placeholder).
${rarityInfo ? `\nRARITY GUIDANCE:\n${rarityInfo}` : ''}
Return only JSON matching the schema.
`;
}

function buildRarityGuidance(rarity: GladiatorRarity, config: RarityConfig): string {
  const rarityLabel = getRarityLabel(rarity);
  const allRarities = Object.entries(config)
    .map(([key, pct]) => `${key}: ${pct}%`)
    .join(", ");

  const guidelines: Record<GladiatorRarity, string> = {
    [GladiatorRarity.BAD]: `This gladiator has RARITY: ${rarityLabel}. They are flawed and unreliable. They should have significant weaknesses, poor stats, and likely injuries or sicknesses. Negative traits are common. Possible rarity distribution: ${allRarities}`,
    [GladiatorRarity.COMMON]: `This gladiator has RARITY: ${rarityLabel}. They are average and unremarkable. They have balanced stats with some weaknesses. Negative traits are possible. Possible rarity distribution: ${allRarities}`,
    [GladiatorRarity.UNCOMMON]: `This gladiator has RARITY: ${rarityLabel}. They are above average with some notable strengths. Stats are generally good with minor weaknesses. Negative traits are less common. Possible rarity distribution: ${allRarities}`,
    [GladiatorRarity.RARE]: `This gladiator has RARITY: ${rarityLabel}. They are quite skilled with clear strengths. Stats are strong across the board. Negative traits are rare but possible. Possible rarity distribution: ${allRarities}`,
    [GladiatorRarity.EPIC]: `This gladiator has RARITY: ${rarityLabel}. They are exceptional with outstanding abilities. Stats are excellent. Negative traits are very rare. They may have a subtle unique power. Possible rarity distribution: ${allRarities}`,
    [GladiatorRarity.LEGENDARY]: `This gladiator has RARITY: ${rarityLabel}. They are legendary with extraordinary abilities. Stats are exceptional. Negative traits are extremely rare. They likely have a unique power. Possible rarity distribution: ${allRarities}`,
    [GladiatorRarity.UNIQUE]: `This gladiator has RARITY: ${rarityLabel}. They are one-of-a-kind with unparalleled abilities. Stats are outstanding. Negative traits are almost non-existent. They have a unique power. Possible rarity distribution: ${allRarities}`,
  };

  return guidelines[rarity];
}

function buildUserPrompt(single: boolean, count?: number, rarity?: GladiatorRarity) {
  if (single) {
    return rarity
      ? `Create one compliant gladiator with rarity: ${rarity}.`
      : "Create one compliant gladiator.";
  }
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

function assertUniqueGladiatorNames(gladiators: Gladiator[]) {
  const seen = new Set<string>();
  for (const gladiator of gladiators) {
    const fullName = `${gladiator.name} ${gladiator.surname}`.replace(/\s+/g, " ").trim().toLowerCase();
    if (!fullName) {
      throw new Error("Each gladiator requires non-empty name and surname values.");
    }
    if (seen.has(fullName)) {
      throw new Error(
        `Duplicate gladiator names detected for "${gladiator.name} ${gladiator.surname}". Provide unique names for each gladiator.`
      );
    }
    seen.add(fullName);
  }
}



const MODEL_JSON_STRUCTURED = "google/gemini-2.5-flash-lite";

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
  // Roll rarity if not pre-rolled
  const rarity = opts.preRolledRarity || (opts.rarityConfig ? rollRarity(opts.rarityConfig) : GladiatorRarity.COMMON);

  // Build rarity guidance
  const rarityGuidance = opts.rarityConfig ? buildRarityGuidance(rarity, opts.rarityConfig) : undefined;

  const messages = [
    { role: "system" as const, content: buildSystemPrompt(rarityGuidance) },
    { role: "user" as const, content: buildUserPrompt(true, undefined, rarity) },
  ];

  const schema = OpenRouterGladiatorJsonSchema;
  let attempts = (opts.retry ?? 1) + 1;


  while (attempts-- > 0) {
    try {
      const content = await llmGenerateRaw(messages, schema, opts);
      const obj = parseContent<unknown>(content);
      const gladiator = GladiatorZ.parse(obj) as Gladiator;
      assertUniqueGladiatorNames([gladiator]);
      return gladiator;
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
    { role: "system" as const, content: buildSystemPrompt() },
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
      assertUniqueGladiatorNames(parsed);
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