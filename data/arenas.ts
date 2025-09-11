import { Arena } from "@/types/arena";

/**
 * Two sample arenas (colosseums):
 * - One in a low-population city with death disabled
 * - One in a big city with death enabled
 */
export const ARENAS: Arena[] = [
  {
    name: "Halicara Training Grounds",
    city: "Halicara", // low population (27k in data/cities.ts)
    deathEnabled: false,
  },
  {
    name: "Velusia Grand Colosseum",
    city: "Velusia", // big city (180k in data/cities.ts)
    deathEnabled: true,
  },
];

