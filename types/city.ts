/**
 * City domain model used by the game for city visits, origin attribution, and lore.
 * Not connected to storage or UI yet.
 */
export interface City {
  /** Name of the city */
  name: string;
  /** Small description suitable for tooltips or cards (1-2 sentences). */
  description: string;
  /** Historic event at this place (2-3 sentences). */
  historicEvent: string;
  /** Number of inhabitants (rounded integer). */
  inhabitants: number;
}

