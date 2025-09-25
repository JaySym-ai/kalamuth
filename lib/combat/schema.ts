import { z } from "zod";

const NonEmpty = z.string().trim().min(1);

export const QueueStatusZ = z.enum(['waiting', 'matched', 'cancelled']);
export const MatchStatusZ = z.enum(['pending', 'in_progress', 'completed', 'cancelled']);

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

export type CombatQueueEntryFromZod = z.infer<typeof CombatQueueEntryZ>;
export type CombatMatchFromZod = z.infer<typeof CombatMatchZ>;
