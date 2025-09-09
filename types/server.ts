/**
 * Game server (aka world) domain model.
 * Each server carries its own gameplay configuration (e.g., gladiator bounds).
 * Not connected to storage or UI yet.
 */

/** Minimal gameplay configuration kept per server/world. */
export interface ServerConfig {
  /** Lower/upper bounds for max health (HP cap) used at creation. */
  gladiatorHealthMin: number;
  gladiatorHealthMax: number;

  /** Lower/upper bounds for all primary stats used at creation. */
  gladiatorStatMin: number;
  gladiatorStatMax: number;

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
  /** Gameplay configuration for this world. */
  config: ServerConfig;
  /** ISO timestamp strings (optional metadata). */
  createdAt?: string;
  updatedAt?: string;
}

