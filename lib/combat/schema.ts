import { z } from "zod";

const NonEmpty = z.string().trim().min(1);

export const QueueStatusZ = z.enum(['waiting', 'matched', 'cancelled']);
export const MatchStatusZ = z.enum(['pending', 'in_progress', 'completed', 'cancelled']);
export const CombatLogTypeZ = z.enum(['introduction', 'action', 'injury', 'death', 'victory', 'system']);
export const WinnerMethodZ = z.enum(['submission', 'knockout', 'death', 'forfeit', 'decision']);

export const CombatQueueEntryZ = z
  .object({
    id: NonEmpty,
    arenaSlug: NonEmpty,
    serverId: NonEmpty,
    gladiatorId: NonEmpty,
    ludusId: NonEmpty,
    userId: NonEmpty,
    rankingPoints: z.number().int().min(0),
    queuedAt: z.string(),
    status: QueueStatusZ,
    matchId: NonEmpty.optional(),
  })
  .strict();

export const CombatMatchZ = z
  .object({
    id: NonEmpty,
    arenaSlug: NonEmpty,
    serverId: NonEmpty,
    gladiator1Id: NonEmpty,
    gladiator2Id: NonEmpty,
    status: MatchStatusZ,
    matchedAt: z.string(),
    startedAt: z.string().optional(),
    completedAt: z.string().optional(),
  })
  .strict();

export const CombatConfigZ = z
  .object({
    maxActions: z.number().int().min(5).max(50).default(20),
    actionIntervalSeconds: z.number().int().min(2).max(10).default(4),
    deathChancePercent: z.number().int().min(0).max(100).default(0),
    injuryChancePercent: z.number().int().min(0).max(100).default(15),
  })
  .strict();

export const CombatLogEntryZ = z
  .object({
    id: NonEmpty,
    matchId: NonEmpty,
    actionNumber: z.number().int().min(0),
    message: NonEmpty,
    createdAt: z.string(),
    type: CombatLogTypeZ,
    locale: z.enum(['en', 'fr']),
    gladiator1Health: z.number().int().min(0).optional(),
    gladiator2Health: z.number().int().min(0).optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .strict();

export const BattleStateZ = z
  .object({
    matchId: NonEmpty,
    actionNumber: z.number().int().min(0),
    gladiator1Health: z.number().int().min(0),
    gladiator2Health: z.number().int().min(0),
    isComplete: z.boolean(),
    winnerId: NonEmpty.optional(),
    winnerMethod: WinnerMethodZ.optional(),
  })
  .strict();

export type CombatQueueEntryFromZod = z.infer<typeof CombatQueueEntryZ>;
export type CombatMatchFromZod = z.infer<typeof CombatMatchZ>;
export type CombatConfigFromZod = z.infer<typeof CombatConfigZ>;
export type CombatLogEntryFromZod = z.infer<typeof CombatLogEntryZ>;
export type BattleStateFromZod = z.infer<typeof BattleStateZ>;
