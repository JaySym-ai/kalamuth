/**
 * Rarity constants for gladiators
 * Centralized color mappings and styling for different rarity levels
 */

import { GladiatorRarity } from "@/types/gladiator";

/**
 * Gradient color classes for rarity backgrounds
 */
export const RARITY_GRADIENTS: Record<GladiatorRarity, string> = {
  [GladiatorRarity.BAD]: "from-stone-700 to-stone-800",
  [GladiatorRarity.COMMON]: "from-gray-600 to-gray-700",
  [GladiatorRarity.UNCOMMON]: "from-green-600 to-green-700",
  [GladiatorRarity.RARE]: "from-blue-600 to-blue-700",
  [GladiatorRarity.EPIC]: "from-purple-600 to-purple-700",
  [GladiatorRarity.LEGENDARY]: "from-amber-600 to-amber-700",
  [GladiatorRarity.UNIQUE]: "from-pink-600 to-pink-700",
};

/**
 * Shadow/glow color classes for rarity effects
 */
export const RARITY_GLOWS: Record<GladiatorRarity, string> = {
  [GladiatorRarity.BAD]: "shadow-stone-500/20",
  [GladiatorRarity.COMMON]: "shadow-gray-500/20",
  [GladiatorRarity.UNCOMMON]: "shadow-green-500/20",
  [GladiatorRarity.RARE]: "shadow-blue-500/20",
  [GladiatorRarity.EPIC]: "shadow-purple-500/20",
  [GladiatorRarity.LEGENDARY]: "shadow-amber-500/20",
  [GladiatorRarity.UNIQUE]: "shadow-pink-500/20",
};

/**
 * Border color classes for rarity
 */
export const RARITY_BORDERS: Record<GladiatorRarity, string> = {
  [GladiatorRarity.BAD]: "border-stone-500/30",
  [GladiatorRarity.COMMON]: "border-gray-500/30",
  [GladiatorRarity.UNCOMMON]: "border-green-500/30",
  [GladiatorRarity.RARE]: "border-blue-500/30",
  [GladiatorRarity.EPIC]: "border-purple-500/30",
  [GladiatorRarity.LEGENDARY]: "border-amber-500/30",
  [GladiatorRarity.UNIQUE]: "border-pink-500/30",
};

/**
 * Text color classes for rarity
 */
export const RARITY_TEXT_COLORS: Record<GladiatorRarity, string> = {
  [GladiatorRarity.BAD]: "text-stone-400",
  [GladiatorRarity.COMMON]: "text-gray-400",
  [GladiatorRarity.UNCOMMON]: "text-green-400",
  [GladiatorRarity.RARE]: "text-blue-400",
  [GladiatorRarity.EPIC]: "text-purple-400",
  [GladiatorRarity.LEGENDARY]: "text-amber-400",
  [GladiatorRarity.UNIQUE]: "text-pink-400",
};

