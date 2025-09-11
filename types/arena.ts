/**
 * Arena (aka Colosseum) domain model.
 * Minimal fields as requested.
 */
export interface Arena {
  /** Display name of the arena/colosseum */
  name: string;
  /** City where the arena is located (must match an existing city name) */
  city: string;
  /** If true, gladiator death is possible in this arena; if false, no one can die here. */
  deathEnabled: boolean;
}

