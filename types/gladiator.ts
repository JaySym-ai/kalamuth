/**
 * Gladiator domain model for the Ludus management game.
 *
 * Notes:
 * - Name and surname are AI-generated.
 * - Health bounds: 30..300 (inclusive) — represents max health (HP cap).
 * - Combat attributes (stats): each in 10..100 (inclusive).
 * - Narrative fields are AI-generated descriptive strings.
 * - Optional fields (injury, sickness, handicap, uniquePower) may be omitted when not applicable.
 */

/** Lower/upper bounds for max health (HP cap). */
export const GLADIATOR_HEALTH_MIN = 30;
export const GLADIATOR_HEALTH_MAX = 300;

/** Lower/upper bounds for all primary stats. */
export const GLADIATOR_STAT_MIN = 10;
export const GLADIATOR_STAT_MAX = 100;

/**
 * Primary combat/behavioral attributes.
 * All values must be integers in [10, 100]. Enforcement is done by generators/validators.
 */
export interface GladiatorStats {
  /** Raw power, affects damage and grapples. [10..100] */
  strength: number;
  /** Flexibility and balance, affects dodges and reaction. [10..100] */
  agility: number;
  /** Hand control and precision, affects weapon handling. [10..100] */
  dexterity: number;
  /** Movement speed and initiative. [10..100] */
  speed: number;
  /** Fortune factor impacting unlikely outcomes. [10..100] */
  chance: number;
  /** Tactical awareness and decision-making. [10..100] */
  intelligence: number;
  /** Crowd and opponent influence. [10..100] */
  charisma: number;
  /** Faithfulness to the ludus/master. [10..100] */
  loyalty: number;
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

  // — Vital status —
  /** Max health (HP cap) in [30..300]. */
  health: number;
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
  /** Primary stats block; each value must be in [10..100]. */
  stats: GladiatorStats;

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

