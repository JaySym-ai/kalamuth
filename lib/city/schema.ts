import { z } from "zod";

// Reusable primitive
const NonEmpty = z.string().trim().min(1);

export const CityZ = z
  .object({
    name: NonEmpty,
    description: NonEmpty, // small description (1–2 sentences recommended, not enforced here)
    historicEvent: NonEmpty, // 2–3 sentences recommended
    inhabitants: z.number().int().min(1),
  })
  .strict();

export type CityFromZod = z.infer<typeof CityZ>;
export const CityArrayZ = z.array(CityZ);

