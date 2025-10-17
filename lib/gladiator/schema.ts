import { z } from "zod";
import {
  GLADIATOR_HEALTH_MIN,
  GLADIATOR_HEALTH_MAX,
  GladiatorRarity,
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

    // Rarity (hidden from UI, used for generation)
    rarity: z.nativeEnum(GladiatorRarity),

    // Vital
    health: z.number().int().min(GLADIATOR_HEALTH_MIN).max(GLADIATOR_HEALTH_MAX),
    currentHealth: z.number().int().min(0).max(GLADIATOR_HEALTH_MAX),
    alive: z.boolean().default(true),

    // Conditions (bilingual)
    injury: BilingualTextZ.optional(),
    injuryTimeLeftHours: z.number().int().min(1).optional(),
    sickness: BilingualTextZ.optional(),

    // Attributes (bilingual)
    stats: BilingualStatsZ,

    // Combat / Ranking
    rankingPoints: z.number().int().min(0).default(1000),

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
    
    // Ensure currentHealth doesn't exceed max health
    if (val.currentHealth > val.health) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "currentHealth cannot exceed max health",
        path: ["currentHealth"],
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

    // Rarity (hidden from UI, used for generation)
    rarity: z.nativeEnum(GladiatorRarity),

    // Vital
    health: z.number().int().min(GLADIATOR_HEALTH_MIN).max(GLADIATOR_HEALTH_MAX),
    currentHealth: z.number().int().min(0).max(GLADIATOR_HEALTH_MAX),
    alive: z.boolean().default(true),

    // Conditions
    injury: NonEmpty.optional(),
    injuryTimeLeftHours: z.number().int().min(1).optional(),
    sickness: NonEmpty.optional(),

    // Attributes
    stats: StatsZ,

    // Combat / Ranking
    rankingPoints: z.number().int().min(0).default(1000),

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
    
    // Ensure currentHealth doesn't exceed max health
    if (val.currentHealth > val.health) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "currentHealth cannot exceed max health",
        path: ["currentHealth"],
      });
    }
  });

export type BilingualGladiatorFromZod = z.infer<typeof BilingualGladiatorZ>;
export type GladiatorFromZod = z.infer<typeof GladiatorZ>;

// Helper for bilingual text schema
const BilingualTextSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    en: { type: "string", minLength: 1 },
    fr: { type: "string", minLength: 1 },
  },
  required: ["en", "fr"],
};

// JSON Schema for OpenRouter Structured Outputs (strict mode)
// We inline the schema (no $ref) to maximize provider compatibility.
export const OpenRouterGladiatorJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: "string", minLength: 1 },
    surname: { type: "string", minLength: 1 },
    avatarUrl: { type: "string", format: "uri" },
    rarity: { type: "string", enum: ["bad", "common", "uncommon", "rare", "epic", "legendary", "unique"] },
    health: { type: "integer", minimum: GLADIATOR_HEALTH_MIN, maximum: GLADIATOR_HEALTH_MAX },
    currentHealth: { type: "integer", minimum: 0, maximum: GLADIATOR_HEALTH_MAX },
    alive: { type: "boolean" },
    injury: BilingualTextSchema,
    injuryTimeLeftHours: { type: "integer", minimum: 1 },
    sickness: BilingualTextSchema,
    stats: {
      type: "object",
      additionalProperties: false,
      properties: {
        strength: BilingualTextSchema,
        agility: BilingualTextSchema,
        dexterity: BilingualTextSchema,
        speed: BilingualTextSchema,
        chance: BilingualTextSchema,
        intelligence: BilingualTextSchema,
        charisma: BilingualTextSchema,
        loyalty: BilingualTextSchema,
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
    lifeGoal: BilingualTextSchema,
    personality: BilingualTextSchema,
    backstory: BilingualTextSchema,
    weakness: BilingualTextSchema,
    fear: BilingualTextSchema,
    likes: BilingualTextSchema,
    dislikes: BilingualTextSchema,
    birthCity: { type: "string", minLength: 1 },
    handicap: BilingualTextSchema,
    uniquePower: BilingualTextSchema,
    physicalCondition: BilingualTextSchema,
    notableHistory: BilingualTextSchema,
  },
  required: [
    "name",
    "surname",
    "avatarUrl",
    "rarity",
    "health",
    "currentHealth",
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
      if: { properties: { injury: BilingualTextSchema }, required: ["injury"] },
      then: { required: ["injuryTimeLeftHours"] },
    },
  ],
} as const;


