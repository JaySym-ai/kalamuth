import { z } from "zod";

const NonEmpty = z.string().trim().min(1);

export const ServerConfigZ = z
  .object({
    gladiatorHealthMin: z.number().int().min(1),
    gladiatorHealthMax: z.number().int().min(1),
    gladiatorStatMin: z.number().int().min(1),
    gladiatorStatMax: z.number().int().min(1),
    // Per-ludus capacity; server capacity is unlimited.
    ludusMaxGladiators: z.number().int().min(1).default(5),
    // How many gladiators to auto-generate when a new ludus is created
    initialGladiatorsPerLudus: z.number().int().min(0).default(0),
    // How many minutes it takes to complete a quest on this server
    questDurationMinutes: z.number().int().min(1).default(60),
  })
  .strict()
  .superRefine((cfg, ctx) => {
    if (cfg.gladiatorHealthMin > cfg.gladiatorHealthMax) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["gladiatorHealthMin"], message: "must be <= gladiatorHealthMax" });
    }
    if (cfg.gladiatorStatMin > cfg.gladiatorStatMax) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["gladiatorStatMin"], message: "must be <= gladiatorStatMax" });
    }
  });

export const GameServerZ = z
  .object({
    id: NonEmpty,
    name: NonEmpty,
    description: z.string().trim().optional(),
    region: z.string().trim().optional(),
    status: z.enum(["online", "maintenance", "offline"]).optional(),
    testingServer: z.boolean().optional(),
    config: ServerConfigZ,
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .strict();

export type ServerConfigFromZod = z.infer<typeof ServerConfigZ>;
export type GameServerFromZod = z.infer<typeof GameServerZ>;

