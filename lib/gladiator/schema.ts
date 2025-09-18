import { z } from "zod";
import {
  GLADIATOR_HEALTH_MIN,
  GLADIATOR_HEALTH_MAX,
} from "@/types/gladiator";

// Base primitives
const NonEmpty = z.string().trim().min(1);
export const StatZ = NonEmpty;

// Bilingual text field schema
export const BilingualTextZ = z.object({
  en: NonEmpty,
  fr: NonEmpty,
});

// Bilingual stats schema
export const BilingualStatsZ = z
  .object({
    strength: BilingualTextZ,
    agility: BilingualTextZ,
    dexterity: BilingualTextZ,
    speed: BilingualTextZ,
    chance: BilingualTextZ,
    intelligence: BilingualTextZ,
    charisma: BilingualTextZ,
    loyalty: BilingualTextZ,
  })
  .strict();

// Legacy single-language stats (for backward compatibility)
export const StatsZ = z
  .object({
    strength: StatZ,
    agility: StatZ,
    dexterity: StatZ,
    speed: StatZ,
    chance: StatZ,
    intelligence: StatZ,
    charisma: StatZ,
    loyalty: StatZ,
  })
  .strict();

// Bilingual gladiator schema (new)
export const BilingualGladiatorZ = z
  .object({
    // Identity (names stay single language as they are proper nouns)
    name: NonEmpty,
    surname: NonEmpty,
    avatarUrl: z.string().url(),

    // Vital
    health: z.number().int().min(GLADIATOR_HEALTH_MIN).max(GLADIATOR_HEALTH_MAX),
    alive: z.boolean().default(true),

    // Conditions (bilingual)
    injury: BilingualTextZ.optional(),
    injuryTimeLeftHours: z.number().int().min(1).optional(),
    sickness: BilingualTextZ.optional(),

    // Attributes (bilingual)
    stats: BilingualStatsZ,

    // Narrative (bilingual)
    lifeGoal: BilingualTextZ,
    personality: BilingualTextZ,
    backstory: BilingualTextZ,
    weakness: BilingualTextZ,
    fear: BilingualTextZ,
    likes: BilingualTextZ,
    dislikes: BilingualTextZ,
    birthCity: NonEmpty, // City names stay single as they are proper nouns
    handicap: BilingualTextZ.optional(),
    uniquePower: BilingualTextZ.optional(),
    physicalCondition: BilingualTextZ,
    notableHistory: BilingualTextZ,
  })
  .strict()
  .superRefine((val, ctx) => {
    // If injury is present, require injuryTimeLeftHours >= 1
    if (val.injury && (!val.injuryTimeLeftHours || val.injuryTimeLeftHours < 1)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "injuryTimeLeftHours must be >= 1 when injury is present",
        path: ["injuryTimeLeftHours"],
      });
    }
  });

// Legacy single-language gladiator schema (for backward compatibility)
export const GladiatorZ = z
  .object({
    // Identity
    name: NonEmpty,
    surname: NonEmpty,
    avatarUrl: z.string().url(),

    // Vital
    health: z.number().int().min(GLADIATOR_HEALTH_MIN).max(GLADIATOR_HEALTH_MAX),
    alive: z.boolean().default(true),

    // Conditions
    injury: NonEmpty.optional(),
    injuryTimeLeftHours: z.number().int().min(1).optional(),
    sickness: NonEmpty.optional(),

    // Attributes
    stats: StatsZ,

    // Narrative
    lifeGoal: NonEmpty,
    personality: NonEmpty,
    backstory: NonEmpty,
    weakness: NonEmpty,
    fear: NonEmpty,
    likes: NonEmpty,
    dislikes: NonEmpty,
    birthCity: NonEmpty,
    handicap: NonEmpty.optional(),
    uniquePower: NonEmpty.optional(),
    physicalCondition: NonEmpty,
    notableHistory: NonEmpty,
  })
  .strict()
  .superRefine((val, ctx) => {
    // If injury is present, require injuryTimeLeftHours >= 1
    if (val.injury && (!val.injuryTimeLeftHours || val.injuryTimeLeftHours < 1)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "injuryTimeLeftHours must be >= 1 when injury is present",
        path: ["injuryTimeLeftHours"],
      });
    }
  });

export type BilingualGladiatorFromZod = z.infer<typeof BilingualGladiatorZ>;
export type GladiatorFromZod = z.infer<typeof GladiatorZ>;

// JSON Schema for OpenRouter Structured Outputs (strict mode)
// We inline the schema (no $ref) to maximize provider compatibility.
export const OpenRouterGladiatorJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: "string", minLength: 1 },
    surname: { type: "string", minLength: 1 },
    avatarUrl: { type: "string", format: "uri" },
    health: { type: "integer", minimum: GLADIATOR_HEALTH_MIN, maximum: GLADIATOR_HEALTH_MAX },
    alive: { type: "boolean" },
    injury: { type: "string", minLength: 1 },
    injuryTimeLeftHours: { type: "integer", minimum: 1 },
    sickness: { type: "string", minLength: 1 },
    stats: {
      type: "object",
      additionalProperties: false,
      properties: {
        strength: { type: "string", minLength: 1 },
        agility: { type: "string", minLength: 1 },
        dexterity: { type: "string", minLength: 1 },
        speed: { type: "string", minLength: 1 },
        chance: { type: "string", minLength: 1 },
        intelligence: { type: "string", minLength: 1 },
        charisma: { type: "string", minLength: 1 },
        loyalty: { type: "string", minLength: 1 },
      },
      required: [
        "strength",
        "agility",
        "dexterity",
        "speed",
        "chance",
        "intelligence",
        "charisma",
        "loyalty",
      ],
    },
    lifeGoal: { type: "string", minLength: 1 },
    personality: { type: "string", minLength: 1 },
    backstory: { type: "string", minLength: 1 },
    weakness: { type: "string", minLength: 1 },
    fear: { type: "string", minLength: 1 },
    likes: { type: "string", minLength: 1 },
    dislikes: { type: "string", minLength: 1 },
    birthCity: { type: "string", minLength: 1 },
    handicap: { type: "string", minLength: 1 },
    uniquePower: { type: "string", minLength: 1 },
    physicalCondition: { type: "string", minLength: 1 },
    notableHistory: { type: "string", minLength: 1 },
  },
  required: [
    "name",
    "surname",
    "avatarUrl",
    "health",
    "alive",
    "stats",
    "lifeGoal",
    "personality",
    "backstory",
    "weakness",
    "fear",
    "likes",
    "dislikes",
    "birthCity",
    "physicalCondition",
    "notableHistory",
  ],
  allOf: [
    {
      if: { properties: { injury: { type: "string", minLength: 1 } }, required: ["injury"] },
      then: { required: ["injuryTimeLeftHours"] },
    },
  ],
} as const;

export function makeGladiatorArrayJsonSchema(count: number) {
  return {
    type: "array",
    minItems: count,
    maxItems: count,
    items: OpenRouterGladiatorJsonSchema,
  } as const;
}

