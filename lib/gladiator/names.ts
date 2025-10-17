import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Fetch all existing gladiator names for a ludus to avoid duplicates
 * @param supabase Supabase client
 * @param ludusId The ludus ID
 * @param serverId Optional server ID to filter tavern gladiators
 * @param excludeTavernId Optional tavern gladiator ID to exclude
 * @returns Set of normalized full names (lowercase, trimmed)
 */
export async function getExistingGladiatorNames(
  supabase: SupabaseClient,
  ludusId: string,
  serverId?: string,
  excludeTavernId?: string
): Promise<Set<string>> {
  // Fetch main gladiators
  const { data: existingGladiators } = await supabase
    .from('gladiators')
    .select('name, surname')
    .eq('ludusId', ludusId);

  // Fetch tavern gladiators
  let tavernQuery = supabase
    .from('tavern_gladiators')
    .select('name, surname')
    .eq('ludusId', ludusId);

  if (serverId) {
    tavernQuery = tavernQuery.eq('serverId', serverId);
  }

  if (excludeTavernId) {
    tavernQuery = tavernQuery.neq('id', excludeTavernId);
  }

  const { data: existingTavernGladiators } = await tavernQuery;

  // Combine and normalize names
  const allGladiators = [
    ...(existingGladiators || []),
    ...(existingTavernGladiators || [])
  ];

  return new Set<string>(
    allGladiators.map(g =>
      `${g.name} ${g.surname}`.replace(/\s+/g, ' ').trim().toLowerCase()
    )
  );
}
