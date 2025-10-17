import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { normalizeGladiator, type NormalizedGladiator } from "@/lib/gladiator/normalize";

/**
 * Standard field selection for gladiators
 * Used across all gladiator queries for consistency
 * Note: Use camelCase for column names (currentHealth, not current_health)
 */
export const GLADIATOR_SELECT_FIELDS =
  "id, ludusId, serverId, name, surname, avatarUrl, birthCity, health, currentHealth, stats, personality, backstory, lifeGoal, likes, dislikes, createdAt, updatedAt, injury, injuryTimeLeftHours, sickness, handicap, uniquePower, weakness, fear, physicalCondition, notableHistory, alive, rankingPoints";

/**
 * Minimal field selection for gladiator lists (arena, combat queue, etc.)
 */
export const GLADIATOR_SELECT_FIELDS_MINIMAL = 
  "id, name, surname, avatarUrl, birthCity, health, stats, rankingPoints, alive, injury, sickness, ludusId, serverId";

/**
 * Fetch all gladiators for a specific ludus
 *
 * @param ludusId - The ludus ID to fetch gladiators for
 * @param locale - The locale for normalization
 * @param minimal - If true, uses minimal field selection (default: false)
 * @returns Array of normalized gladiators
 */
export async function getGladiatorsByLudus(
  ludusId: string,
  locale: string,
  minimal: boolean = false
): Promise<NormalizedGladiator[]> {
  const supabase = createClient(await cookies());

  const selectFields = minimal ? GLADIATOR_SELECT_FIELDS_MINIMAL : GLADIATOR_SELECT_FIELDS;

  const { data: glads, error } = await supabase
    .from("gladiators")
    .select(selectFields as "*")
    .eq("ludusId", ludusId);

  if (error) {
    console.error("Error fetching gladiators:", error);
    return [];
  }

  if (!glads) return [];

  try {
    return glads.map(doc =>
      normalizeGladiator(doc.id as string, doc as unknown as Record<string, unknown>, locale)
    );
  } catch (normalizationError) {
    console.error("Error normalizing gladiators:", normalizationError);
    return [];
  }
}

/**
 * Fetch a single gladiator by ID
 * 
 * @param gladiatorId - The gladiator ID
 * @param locale - The locale for normalization
 * @returns Normalized gladiator or null if not found
 */
export async function getGladiatorById(
  gladiatorId: string,
  locale: string
): Promise<NormalizedGladiator | null> {
  const supabase = createClient(await cookies());
  
  const { data: gladiatorData, error } = await supabase
    .from("gladiators")
    .select(GLADIATOR_SELECT_FIELDS)
    .eq("id", gladiatorId)
    .maybeSingle();

  if (error || !gladiatorData) {
    return null;
  }

  return normalizeGladiator(
    gladiatorData.id as string,
    gladiatorData as unknown as Record<string, unknown>,
    locale
  );
}

/**
 * Fetch tavern gladiators for a specific ludus
 *
 * @param ludusId - The ludus ID to fetch tavern gladiators for
 * @param locale - The locale for normalization
 * @returns Array of normalized tavern gladiators
 */
export async function getTavernGladiatorsByLudus(
  ludusId: string,
  locale: string
): Promise<NormalizedGladiator[]> {
  const supabase = createClient(await cookies());

  const { data: glads, error } = await supabase
    .from("tavern_gladiators")
    .select(GLADIATOR_SELECT_FIELDS)
    .eq("ludusId", ludusId)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("Error fetching tavern gladiators:", error);
    return [];
  }

  if (!glads) return [];

  try {
    return glads.map(doc =>
      normalizeGladiator(doc.id as string, doc as unknown as Record<string, unknown>, locale)
    );
  } catch (normalizationError) {
    console.error("Error normalizing tavern gladiators:", normalizationError);
    return [];
  }
}

/**
 * Fetch initial gladiators for a ludus (used during ludus creation)
 * Uses a subset of fields since some fields may not exist yet
 * 
 * @param ludusId - The ludus ID to fetch initial gladiators for
 * @param locale - The locale for normalization
 * @returns Array of normalized gladiators
 */
export async function getInitialGladiatorsByLudus(
  ludusId: string,
  locale: string
): Promise<NormalizedGladiator[]> {
  const supabase = createClient(await cookies());

  const { data: glads, error } = await supabase
    .from("gladiators")
    .select("id, name, surname, avatarUrl, birthCity, health, currentHealth, stats, personality, backstory, lifeGoal, likes, dislikes, createdAt, physicalCondition, notableHistory, alive")
    .eq("ludusId", ludusId);

  if (error) {
    console.error("Error fetching initial gladiators:", error);
    return [];
  }

  if (!glads) return [];

  try {
    return glads.map(doc =>
      normalizeGladiator(doc.id as string, doc as unknown as Record<string, unknown>, locale)
    );
  } catch (normalizationError) {
    console.error("Error normalizing initial gladiators:", normalizationError);
    return [];
  }
}

