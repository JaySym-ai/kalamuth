/**
 * Ludus (gladiator school) domain model.
 * Each Ludus belongs to exactly one Firebase user and one game server/world.
 * Stored in Firestore in collection "ludi" (plural of ludus).
 */

export type Currency = "sestertii" | "denarii";

export interface Treasury {
  /** Currency unit; default is ancient Roman sestertii (HS). */
  currency: Currency;
  /** Whole-number balance in smallest unit (no decimals). */
  amount: number;
}


export interface Facilities {
  /** Healing capacity and recovery speed. [0..5] */
  infirmaryLevel: number;
  /** Training yard quality. [0..5] */
  trainingGroundLevel: number;
  /** Living quarters quality/capacity. [0..5] */
  quartersLevel: number;
  /** Food quality and morale effect. [0..5] */
  kitchenLevel: number;
}

export interface Ludus {
  /** Firestore doc id (injected by converters on read). */
  id?: string;

  /** Firebase Auth UID of the owner. */
  userId: string;
  /** Server/world id, e.g., "alpha-1". */
  serverId: string;

  /** Display name of the ludus. */
  name: string;
  /** Public logo URL. */
  logoUrl: string;

  /** Economy treasury. */
  treasury: Treasury;

  /** Reputation/renown in [0..100]. */
  reputation: number;
  /** Overall morale in [0..100]. */
  morale: number;


  /** Facility upgrade levels. */
  facilities: Facilities;

  /** Max gladiators this ludus can hold (defaulted from server at creation). */
  maxGladiators: number;
  /** Current number of gladiators assigned (cached for quick list queries). */
  gladiatorCount: number;

  /** Optional flavor. */
  motto?: string;
  /** Optional city location for flavor/lore. */
  locationCity?: string;

  /** ISO timestamps. */
  createdAt: string;
  updatedAt: string;

  /** Soft delete flag (optional). */
  isDeleted?: boolean;
}

