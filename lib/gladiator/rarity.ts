import { GladiatorRarity, RARITY_LEVELS } from "@/types/gladiator";
import type { RarityConfig } from "@/types/server";

/**
 * Rolls a rarity level based on the provided configuration percentages.
 * The percentages should sum to 100 (or close to it).
 * 
 * @param config - RarityConfig with percentage values for each rarity level
 * @returns A GladiatorRarity value
 */
export function rollRarity(config: RarityConfig): GladiatorRarity {
  // Create a weighted array based on percentages
  const roll = Math.random() * 100;
  let cumulative = 0;

  // Order matters: check in order of rarity levels
  const rarityOrder: (keyof RarityConfig)[] = [
    'bad',
    'common',
    'uncommon',
    'rare',
    'epic',
    'legendary',
    'unique',
  ];

  for (const rarityKey of rarityOrder) {
    cumulative += config[rarityKey];
    if (roll < cumulative) {
      return GladiatorRarity[rarityKey.toUpperCase() as keyof typeof GladiatorRarity];
    }
  }

  // Fallback to common if rounding errors occur
  return GladiatorRarity.COMMON;
}

/**
 * Gets a human-readable label for a rarity level.
 * @param rarity - The rarity level
 * @returns A capitalized string representation
 */
export function getRarityLabel(rarity: GladiatorRarity): string {
  return rarity.charAt(0).toUpperCase() + rarity.slice(1);
}

/**
 * Gets all rarity levels in order from worst to best.
 * @returns Array of rarity levels
 */
export function getRarityLevels(): GladiatorRarity[] {
  return [...RARITY_LEVELS];
}

/**
 * Checks if a rarity is considered "high quality" (rare or better).
 * @param rarity - The rarity level
 * @returns true if rarity is rare, epic, legendary, or unique
 */
export function isHighQuality(rarity: GladiatorRarity): boolean {
  return [
    GladiatorRarity.RARE,
    GladiatorRarity.EPIC,
    GladiatorRarity.LEGENDARY,
    GladiatorRarity.UNIQUE,
  ].includes(rarity);
}

/**
 * Checks if a rarity is considered "low quality" (bad or common).
 * @param rarity - The rarity level
 * @returns true if rarity is bad or common
 */
export function isLowQuality(rarity: GladiatorRarity): boolean {
  return [GladiatorRarity.BAD, GladiatorRarity.COMMON].includes(rarity);
}

/**
 * Gets the rarity config for initial gladiators (only bad and common).
 * @returns RarityConfig with only bad and common rarities
 */
export function getInitialGladiatorRarityConfig(): RarityConfig {
  return {
    bad: 30,
    common: 70,
    uncommon: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
    unique: 0,
  };
}

