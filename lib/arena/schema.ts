import { z } from "zod";

// Reusable primitive
const NonEmpty = z.string().trim().min(1);

export const ArenaZ = z
  .object({
    name: NonEmpty,
    city: NonEmpty,
    deathEnabled: z.boolean(),
  })
  .strict();

export type ArenaFromZod = z.infer<typeof ArenaZ>;
export const ArenaArrayZ = z.array(ArenaZ);

