import "server-only";
import type { CombatConfig } from "@/types/combat";
import type { Arena } from "@/types/arena";

/**
 * Default combat configuration values
 */
export const DEFAULT_COMBAT_CONFIG: CombatConfig = {
  maxActions: 20,
  actionIntervalSeconds: 4,
  deathChancePercent: 0,
  injuryChancePercent: 15,
};

/**
 * Get combat configuration based on arena settings
 */
export function getCombatConfigForArena(arena: Arena): CombatConfig {
  return {
    maxActions: DEFAULT_COMBAT_CONFIG.maxActions,
    actionIntervalSeconds: DEFAULT_COMBAT_CONFIG.actionIntervalSeconds,
    deathChancePercent: arena.deathEnabled ? 5 : 0, // 5% death chance in death-enabled arenas
    injuryChancePercent: arena.deathEnabled ? 25 : 15, // Higher injury chance in brutal arenas
  };
}

/**
 * Validate and clamp combat configuration values
 */
export function validateCombatConfig(config: Partial<CombatConfig>): CombatConfig {
  return {
    maxActions: Math.max(5, Math.min(50, config.maxActions ?? DEFAULT_COMBAT_CONFIG.maxActions)),
    actionIntervalSeconds: Math.max(2, Math.min(10, config.actionIntervalSeconds ?? DEFAULT_COMBAT_CONFIG.actionIntervalSeconds)),
    deathChancePercent: Math.max(0, Math.min(100, config.deathChancePercent ?? DEFAULT_COMBAT_CONFIG.deathChancePercent)),
    injuryChancePercent: Math.max(0, Math.min(100, config.injuryChancePercent ?? DEFAULT_COMBAT_CONFIG.injuryChancePercent)),
  };
}

