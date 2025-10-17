import type { Ludus } from "@/types/ludus";

/**
 * Parse a value to a number with a fallback
 */
export function parseNumber(value: unknown, fallback: number): number {
  if (typeof value === "number") {
    return value;
  }
  const parsed = Number.parseInt(typeof value === "string" ? value : `${fallback}`, 10);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Parse currency from treasury source
 */
export function parseCurrency(
  treasurySource: { currency?: string; amount?: unknown } | null
): "denarii" | "sestertii" {
  const currency = treasurySource?.currency;
  return currency === "denarii" || currency === "sestertii" ? currency : "sestertii";
}

/**
 * Transform raw ludus data from database into typed Ludus object
 * This handles all the type conversions and fallbacks in one place
 * 
 * @param rawLudus - Raw ludus data from Supabase query
 * @param userId - User ID to use as fallback
 * @returns Properly typed and transformed Ludus object
 */
export function transformLudusData(
  rawLudus: Record<string, unknown>,
  userId: string
): Ludus & { id: string } {
  const treasurySource = (rawLudus.treasury as { currency?: string; amount?: unknown } | null) ?? {};
  const facilitiesSource = (rawLudus.facilities as Record<string, unknown> | null) ?? {};

  const currency = parseCurrency(treasurySource);

  return {
    id: (rawLudus.id as string) ?? "",
    userId: (rawLudus.userId as string) ?? userId,
    serverId: (rawLudus.serverId as string) ?? "",
    name: (rawLudus.name as string) ?? "Ludus",
    logoUrl: (rawLudus.logoUrl as string) ?? "🏛️",
    treasury: {
      currency,
      amount: parseNumber(treasurySource.amount, 0),
    },
    reputation: parseNumber(rawLudus.reputation, 0),
    morale: parseNumber(rawLudus.morale, 50),
    facilities: {
      infirmaryLevel: parseNumber(facilitiesSource.infirmaryLevel, 1),
      trainingGroundLevel: parseNumber(facilitiesSource.trainingGroundLevel, 1),
      quartersLevel: parseNumber(facilitiesSource.quartersLevel, 1),
      kitchenLevel: parseNumber(facilitiesSource.kitchenLevel, 1),
    },
    maxGladiators: parseNumber(rawLudus.maxGladiators, 0),
    gladiatorCount: parseNumber(rawLudus.gladiatorCount, 0),
    motto: typeof rawLudus.motto === "string" ? rawLudus.motto : undefined,
    locationCity: typeof rawLudus.locationCity === "string" ? rawLudus.locationCity : undefined,
    createdAt: typeof rawLudus.createdAt === "string" ? rawLudus.createdAt : new Date().toISOString(),
    updatedAt: typeof rawLudus.updatedAt === "string" ? rawLudus.updatedAt : new Date().toISOString(),
  } as Ludus & { id: string };
}

