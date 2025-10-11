/**
 * Game server (aka world) domain model.
 * Each server carries its own gameplay configuration (e.g., gladiator bounds).
 * Not connected to storage or UI yet.
 */

/** Rarity percentage configuration for gladiator generation. */
export interface RarityConfig {
  /** Percentage chance for bad rarity (0-100). */
  bad: number;
  /** Percentage chance for common rarity (0-100). */
  common: number;
  /** Percentage chance for uncommon rarity (0-100). */
  uncommon: number;
  /** Percentage chance for rare rarity (0-100). */
  rare: number;
  /** Percentage chance for epic rarity (0-100). */
  epic: number;
  /** Percentage chance for legendary rarity (0-100). */
  legendary: number;
  /** Percentage chance for unique rarity (0-100). */
  unique: number;
}

/** Minimal gameplay configuration kept per server/world. */
export interface ServerConfig {
  /** Lower/upper bounds for max health (HP cap) used at creation. */
  gladiatorHealthMin: number;
  gladiatorHealthMax: number;

  /** Lower/upper bounds for all primary stats used at creation. */
  gladiatorStatMin: number;
  gladiatorStatMax: number;

  /** Maximum number of gladiators allowed per ludus (server capacity is unlimited). */
  ludusMaxGladiators: number;
  /** Number of gladiators to auto-generate for a new ludus on this server. */
  initialGladiatorsPerLudus: number;

  /** How many minutes it takes to complete a quest on this server. */
  questDurationMinutes: number;

  /** Rarity percentage configuration for gladiator generation. */
  rarityConfig: RarityConfig;

  /**
   * Placeholder for future knobs (e.g., economy rates, injury recovery, AI model hints).
   * Extend this interface over time rather than creating unrelated globals.
   */
}

/**
 * A server/world that players connect to.
 */
export interface GameServer {
  /** Stable identifier/slug (e.g., "alpha-1"). */
  id: string;
  /** Display name (e.g., "Alpha 1"). */
  name: string;
  /** Optional description shown in server selection. */
  description?: string;
  /** Current status (optional; informational). */
  status?: "new" | "live" | "closed";
  /** Whether this server is restricted to paid users only (optional). */
  paidOnly?: boolean;
  /** Whether gladiators can die in arena fights (optional). If true, death is possible; if false, no gladiator will ever die. */
  hardcore?: boolean;
  /** Whether this server is only accessible to specific test users (optional). */
  testingServer?: boolean;
  /** Gameplay configuration for this world. */
  config: ServerConfig;
  /** ISO timestamp strings (optional metadata). */
  createdAt?: string;
  updatedAt?: string;
}

