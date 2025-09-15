import { z } from "zod";

const NonEmpty = z.string().trim().min(1);

export const CurrencyZ = z.union([z.literal("sestertii"), z.literal("denarii")]);

export const TreasuryZ = z
  .object({
    currency: CurrencyZ.default("sestertii"),
    amount: z.number().int().min(0).default(0),
  })
  .strict();

export const FacilitiesZ = z
  .object({
    infirmaryLevel: z.number().int().min(0).max(5).default(1),
    trainingGroundLevel: z.number().int().min(0).max(5).default(1),
    quartersLevel: z.number().int().min(0).max(5).default(1),
    kitchenLevel: z.number().int().min(0).max(5).default(1),
  })
  .strict();


export const LudusZ = z
  .object({
    // Relations
    userId: NonEmpty,
    serverId: NonEmpty,

    // Identity
    name: NonEmpty,
    logoUrl: z.string().url(),

    // Economy & meta
    treasury: TreasuryZ,
    reputation: z.number().int().min(0).max(100).default(0),
    morale: z.number().int().min(0).max(100).default(50),

    facilities: FacilitiesZ,

    maxGladiators: z.number().int().min(1),
    gladiatorCount: z.number().int().min(0).default(0),

    motto: z.string().trim().optional(),
    locationCity: z.string().trim().optional(),

    createdAt: z.string(),
    updatedAt: z.string(),

    isDeleted: z.boolean().optional(),
  })
  .strict();

export type LudusFromZod = z.infer<typeof LudusZ>;

