import { z } from "zod";
import {
  GLADIATOR_HEALTH_MIN,
  GLADIATOR_HEALTH_MAX,
  GLADIATOR_STAT_MIN,
  GLADIATOR_STAT_MAX,
} from "@/types/gladiator";

// Base primitives
const NonEmpty = z.string().trim().min(1);
export const StatZ = z.number().int().min(GLADIATOR_STAT_MIN).max(GLADIATOR_STAT_MAX);

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
        strength: { type: "integer", minimum: GLADIATOR_STAT_MIN, maximum: GLADIATOR_STAT_MAX },
        agility: { type: "integer", minimum: GLADIATOR_STAT_MIN, maximum: GLADIATOR_STAT_MAX },
        dexterity: { type: "integer", minimum: GLADIATOR_STAT_MIN, maximum: GLADIATOR_STAT_MAX },
        speed: { type: "integer", minimum: GLADIATOR_STAT_MIN, maximum: GLADIATOR_STAT_MAX },
        chance: { type: "integer", minimum: GLADIATOR_STAT_MIN, maximum: GLADIATOR_STAT_MAX },
        intelligence: { type: "integer", minimum: GLADIATOR_STAT_MIN, maximum: GLADIATOR_STAT_MAX },
        charisma: { type: "integer", minimum: GLADIATOR_STAT_MIN, maximum: GLADIATOR_STAT_MAX },
        loyalty: { type: "integer", minimum: GLADIATOR_STAT_MIN, maximum: GLADIATOR_STAT_MAX },
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

