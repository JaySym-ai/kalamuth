/**
 * Gladiator domain model for the Ludus management game.
 *
 * Notes:
 * - Name and surname are AI-generated.
 * - Health bounds: 30..300 (inclusive) — represents max health (HP cap).
 * - Combat attributes (stats): each is a 12 sentence descriptive string.
 * - Narrative fields are AI-generated descriptive strings.
 * - Optional fields (injury, sickness, handicap, uniquePower) may be omitted when not applicable.
 */

/** Lower/upper bounds for max health (HP cap). */
export const GLADIATOR_HEALTH_MIN = 30;
export const GLADIATOR_HEALTH_MAX = 300;

/** Rarity levels for gladiators (hidden from UI, used for generation). */
export enum GladiatorRarity {
  BAD = 'bad',
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
  UNIQUE = 'unique',
}

export const RARITY_LEVELS = [
  GladiatorRarity.BAD,
  GladiatorRarity.COMMON,
  GladiatorRarity.UNCOMMON,
  GladiatorRarity.RARE,
  GladiatorRarity.EPIC,
  GladiatorRarity.LEGENDARY,
  GladiatorRarity.UNIQUE,
] as const;



/**
 * Primary combat/behavioral attributes.
 * Each value is a 1–2 sentence descriptive string about how this gladiator expresses that trait in combat and behavior.
 */
export interface GladiatorStats {
  /** Raw power; describe typical displays of might. */
  strength: string;
  /** Flexibility and balance; describe dodges, footwork, recovery. */
  agility: string;
  /** Hand control and precision; describe weapon handling and finesse. */
  dexterity: string;
  /** Movement pace and initiative; describe bursts, closing distance, starts. */
  speed: string;
  /** Fortune factor; describe luck swings and improbable turns. */
  chance: string;
  /** Tactical awareness; describe reading opponents and decision-making. */
  intelligence: string;
  /** Presence and influence; describe crowd sway and psychological edge. */
  charisma: string;
  /** Faithfulness to the ludus; describe loyalty under pressure. */
  loyalty: string;
}

/**
 * Core Gladiator model used by the game. Not connected to storage or UI.
 */
export interface Gladiator {
  // — Identity —
  /** Given name (AI-chosen). */
  name: string;
  /** Surname (AI-chosen based on other factors of this gladiator). */
  surname: string;

  /** URL to avatar image for this gladiator. */
  avatarUrl: string;

  // — Rarity (hidden from UI, used for generation) —
  /** Rarity level of this gladiator (affects characteristics). */
  rarity: GladiatorRarity;

  // — Vital status —
  /** Max health (HP cap) in [30..300]. */
  health: number;
  /** Current health points - may be reduced by combat/injury and restored by healing. */
  currentHealth: number;
  /** Alive flag (default true). If false, the gladiator is unusable in play. */
  alive: boolean;

  // — Conditions —
  /** Description of current injury, if any ("" or undefined if none). */
  injury?: string;
  /** Hours remaining until fully recovered from current injury. Only relevant if injured. */
  injuryTimeLeftHours?: number;
  /** Description of sickness if present (undefined/empty if healthy). */
  sickness?: string;

  // — Core attributes —
  /** Primary stats block; each value is a 1–2 sentence description for that trait. */
  stats: GladiatorStats;

  // — Combat / Ranking —
  /** Ranking points for matchmaking (default 1000). Used to match gladiators of similar skill level. */
  rankingPoints: number;

  // — Narrative / flavor (all AI-generated strings) —
  /** Long-term ambition driving this gladiator. */
  lifeGoal: string;
  /** Personality profile (temperament, traits). */
  personality: string;
  /** Origin story and formative events. */
  backstory: string;
  /** Combat or character weakness. */
  weakness: string;
  /** What he fears the most. */
  fear: string;
  /** What he likes (interests, tastes). */
  likes: string;
  /** What he doesn't like (aversions). */
  dislikes: string;
  /** City of birth. */
  birthCity: string;
  /** Any lasting limitation (optional). */
  handicap?: string;
  /** Subtle, lightly supernatural trait affecting fights (optional, never overpowered). */
  uniquePower?: string;
  /** Current physical condition (free text used by fight narration). */
  physicalCondition: string;
  /** Notable past detail that can impact behavior or matchups. */
  notableHistory: string;
}

