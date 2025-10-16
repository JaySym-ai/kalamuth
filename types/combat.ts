/**
 * Combat queue and matchmaking domain models.
 */

export type QueueStatus = 'waiting' | 'matched' | 'cancelled';
export type MatchStatus = 'pending_acceptance' | 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type AcceptanceStatus = 'pending' | 'accepted' | 'declined';

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

  /** Deadline for match acceptance (for pending_acceptance status) */
  acceptanceDeadline?: string;
}

/**
 * Represents a player's response to a match request
 */
export interface CombatMatchAcceptance {
  /** Unique acceptance ID */
  id: string;

  /** Match ID this acceptance belongs to */
  matchId: string;

  /** Gladiator ID that needs to respond */
  gladiatorId: string;

  /** User ID that owns the gladiator */
  userId: string;

  /** Current acceptance status */
  status: AcceptanceStatus;

  /** When the user responded (if accepted or declined) */
  respondedAt?: string;

  /** When this acceptance was created */
  createdAt: string;
}


export type CombatLogType = "introduction" | "action" | "injury" | "death" | "victory" | "system";
export type WinnerMethod = "submission" | "knockout" | "death" | "forfeit" | "decision";

export interface CombatLogEntry {
  id: string;
  matchId: string;
  actionNumber: number;
  message: string;
  createdAt: string;
  type: CombatLogType;
  locale: string;
  gladiator1Health?: number;
  gladiator2Health?: number;
  metadata?: Record<string, unknown>;
}

export interface CombatantSummary {
  id: string;
  name: string;
  surname: string;
  avatarUrl?: string | null;
  rankingPoints: number;
  health: number;
  currentHealth: number;
  userId: string | null;
  ludusId: string | null;
  alive: boolean;
}

export interface CombatMatchDetails {
  match: CombatMatch;
  gladiators: CombatantSummary[];
  logs: CombatLogEntry[];
  acceptances?: CombatMatchAcceptance[];
}

/**
 * Combat configuration for a match
 */
export interface CombatConfig {
  /** Maximum number of actions in the battle (default: 20) */
  maxActions: number;
  /** Seconds between each action (default: 4) */
  actionIntervalSeconds: number;
  /** Percentage chance of death (0-100, default: 0 for training arenas) */
  deathChancePercent: number;
  /** Percentage chance of injury per action (0-100, default: 15) */
  injuryChancePercent: number;
}

/**
 * Extended match with combat configuration
 */
export interface CombatMatchWithConfig extends CombatMatch {
  maxActions: number;
  actionIntervalSeconds: number;
  deathChancePercent: number;
  injuryChancePercent: number;
  winnerId?: string;
  winnerMethod?: WinnerMethod;
  totalActions: number;
  durationSeconds?: number;
}

/**
 * Full gladiator data for combat (includes all traits for AI context)
 */
export interface CombatGladiator extends CombatantSummary {
  injury?: string;
  injuryTimeLeftHours?: number;
  sickness?: string;
  stats: {
    strength: string;
    agility: string;
    dexterity: string;
    speed: string;
    chance: string;
    intelligence: string;
    charisma: string;
    loyalty: string;
  };
  lifeGoal: string;
  personality: string;
  backstory: string;
  weakness: string;
  fear: string;
  likes: string;
  dislikes: string;
  birthCity: string;
  handicap?: string;
  uniquePower?: string;
  physicalCondition: string;
  notableHistory: string;
}

/**
 * Battle state during combat
 */
export interface BattleState {
  matchId: string;
  actionNumber: number;
  gladiator1Health: number;
  gladiator2Health: number;
  isComplete: boolean;
  winnerId?: string;
  winnerMethod?: WinnerMethod;
}
