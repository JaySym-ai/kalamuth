import type { NormalizedGladiator } from "./normalize";
import type { LucideIcon } from "lucide-react";
import { Heart, AlertCircle, Activity } from "lucide-react";

/**
 * Health status variant types
 */
export type HealthStatusVariant = "healthy" | "injured" | "sick" | "dead" | "queued" | "critical";

/**
 * Basic health status for simple displays (dashboard, gladiator list)
 */
export interface BasicHealthStatus {
  label: string;
  color: string;
  icon: LucideIcon;
  variant: HealthStatusVariant;
}

/**
 * Extended health status for complex displays (arena selector, combat)
 */
export interface ExtendedHealthStatus extends BasicHealthStatus {
  badgeClass: string;
  borderClass: string;
  disabled: boolean;
}

/**
 * Translation keys needed for health status
 */
export interface HealthStatusTranslations {
  healthy: string;
  injured: string;
  sick: string;
  dead?: string;
  queued?: string;
}

/**
 * Get basic health status for a gladiator
 * Used in dashboard and gladiator list views
 * 
 * @param gladiator - The gladiator to check
 * @param translations - Translation strings for status labels
 * @returns Basic health status with label, color, and icon
 */
export function getBasicHealthStatus(
  gladiator: NormalizedGladiator,
  translations: HealthStatusTranslations
): BasicHealthStatus {
  if (!gladiator.alive) {
    return {
      label: translations.dead || "Dead",
      color: "text-gray-400",
      icon: AlertCircle,
      variant: "critical",
    };
  }

  if (gladiator.injury) {
    return {
      label: translations.injured,
      color: "text-orange-400",
      icon: AlertCircle,
      variant: "injured",
    };
  }

  if (gladiator.sickness) {
    return {
      label: translations.sick,
      color: "text-yellow-400",
      icon: Activity,
      variant: "sick",
    };
  }

  return {
    label: translations.healthy,
    color: "text-green-400",
    icon: Heart,
    variant: "healthy",
  };
}

/**
 * Get extended health status for a gladiator with additional styling
 * Used in arena selector and combat views
 * 
 * @param gladiator - The gladiator to check
 * @param translations - Translation strings for status labels
 * @param options - Additional options for status determination
 * @returns Extended health status with badge and border classes
 */
export function getExtendedHealthStatus(
  gladiator: NormalizedGladiator,
  translations: Required<HealthStatusTranslations>,
  options?: {
    isQueued?: boolean;
    queuedGladiatorIds?: Set<string>;
  }
): ExtendedHealthStatus {
  // Check if dead
  if (!gladiator.alive) {
    return {
      label: translations.dead,
      color: "text-gray-300",
      icon: AlertCircle,
      badgeClass: "bg-gray-800/60",
      borderClass: "border-gray-700/50",
      disabled: true,
      variant: "critical",
    };
  }

  // Check if queued
  const isQueued = options?.isQueued || options?.queuedGladiatorIds?.has(gladiator.id);
  if (isQueued) {
    return {
      label: translations.queued,
      color: "text-blue-300",
      icon: Activity,
      badgeClass: "bg-blue-900/40",
      borderClass: "border-blue-800/40",
      disabled: true,
      variant: "queued",
    };
  }

  // Check if injured
  if (gladiator.injury) {
    return {
      label: translations.injured,
      color: "text-red-300",
      icon: AlertCircle,
      badgeClass: "bg-red-900/30",
      borderClass: "border-red-600/60 hover:border-red-500/80 focus-visible:border-red-400/80",
      disabled: false,
      variant: "injured",
    };
  }

  // Check if sick
  if (gladiator.sickness) {
    return {
      label: translations.sick,
      color: "text-blue-300",
      icon: Activity,
      badgeClass: "bg-blue-900/30",
      borderClass: "border-blue-600/60 hover:border-blue-500/80 focus-visible:border-blue-400/80",
      disabled: false,
      variant: "sick",
    };
  }

  // Healthy
  return {
    label: translations.healthy,
    color: "text-emerald-300",
    icon: Heart,
    badgeClass: "bg-emerald-900/20",
    borderClass: "border-emerald-600/40 hover:border-emerald-500/60 focus-visible:border-emerald-400/80",
    disabled: false,
    variant: "healthy",
  };
}

/**
 * Check if a gladiator is available for combat
 * 
 * @param gladiator - The gladiator to check
 * @param options - Additional options for availability check
 * @returns True if gladiator is available for combat
 */
export function isGladiatorAvailable(
  gladiator: NormalizedGladiator,
  options?: {
    queuedGladiatorIds?: Set<string>;
  }
): boolean {
  if (!gladiator.alive) return false;
  if (options?.queuedGladiatorIds?.has(gladiator.id)) return false;
  return true;
}

/**
 * Get health percentage for a gladiator
 * 
 * @param gladiator - The gladiator to check
 * @param maxHealth - Maximum health value (default: 300)
 * @returns Health percentage (0-100)
 */
export function getHealthPercentage(
  gladiator: NormalizedGladiator,
  maxHealth: number = 300
): number {
  return Math.max(0, Math.min(100, (gladiator.health / maxHealth) * 100));
}

/**
 * Get health bar color based on health percentage
 * 
 * @param healthPercent - Health percentage (0-100)
 * @returns Tailwind color class
 */
export function getHealthBarColor(healthPercent: number): string {
  if (healthPercent > 60) return "bg-emerald-500";
  if (healthPercent > 30) return "bg-amber-500";
  return "bg-red-500";
}

/**
 * Get health bar glow color based on health percentage
 * 
 * @param healthPercent - Health percentage (0-100)
 * @returns Tailwind shadow class
 */
export function getHealthBarGlow(healthPercent: number): string {
  if (healthPercent > 60) return "shadow-emerald-500/50";
  if (healthPercent > 30) return "shadow-amber-500/50";
  return "shadow-red-500/50";
}

