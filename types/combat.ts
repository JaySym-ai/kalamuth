/**
 * Combat queue and matchmaking domain models.
 */

export type QueueStatus = 'waiting' | 'matched' | 'cancelled';
export type MatchStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

/**
 * Represents a gladiator in the combat queue for a specific arena.
 */
export interface CombatQueueEntry {
  /** Unique queue entry ID */
  id: string;
  
  /** Arena slug (e.g., 'halicara-training-grounds') */
  arenaSlug: string;
  
  /** Server ID this queue belongs to */
  serverId: string;
  
  /** Gladiator in queue */
  gladiatorId: string;
  
  /** Ludus owning this gladiator */
  ludusId: string;
  
  /** User owning this ludus */
  userId: string;
  
  /** Ranking points snapshot at queue time (for stable matchmaking) */
  rankingPoints: number;
  
  /** When this gladiator joined the queue */
  queuedAt: string;
  
  /** Current queue status */
  status: QueueStatus;
  
  /** Match ID if matched */
  matchId?: string;
}

/**
 * Represents a matched pair of gladiators ready for combat.
 */
export interface CombatMatch {
  /** Unique match ID */
  id: string;
  
  /** Arena where combat will take place */
  arenaSlug: string;
  
  /** Server ID */
  serverId: string;
  
  /** First gladiator */
  gladiator1Id: string;
  
  /** Second gladiator */
  gladiator2Id: string;
  
  /** Match status */
  status: MatchStatus;
  
  /** When the match was created */
  matchedAt: string;
  
  /** When combat started (if in_progress or completed) */
  startedAt?: string;
  
  /** When combat ended (if completed) */
  completedAt?: string;
}
