/**
 * City domain model used by the game for city visits, origin attribution, and lore.
 * Not connected to storage or UI yet.
 */
export interface City {
  /** Unique identifier for translation lookup */
  id: string;
  /** Name of the city (fallback if translation not found) */
  name: string;
  /** Small description suitable for tooltips or cards (1-2 sentences). */
  description: string;
  /** Historic event at this place (2-3 sentences). */
  historicEvent: string;
  /** Number of inhabitants (rounded integer). */
  inhabitants: number;
}

