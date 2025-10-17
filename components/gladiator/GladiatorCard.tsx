"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { NormalizedGladiator } from "@/lib/gladiator/normalize";
import { getBasicHealthStatus } from "@/lib/gladiator/health-status";
import GladiatorAvatar from "@/components/ui/GladiatorAvatar";
import { gladiatorCardEntrance } from "@/lib/animations/presets";

interface GladiatorCardProps {
  /**
   * The gladiator data to display
   */
  gladiator: NormalizedGladiator;
  
  /**
   * Current locale for routing
   */
  locale: string;
  
  /**
   * Translations for health status and labels
   */
  translations: {
    health: string;
    healthy: string;
    injured: string;
    sick: string;
  };
  
  /**
   * Card size variant
   * - "compact": Small card for grids (dashboard)
   * - "full": Full-sized card with more details (gladiators page)
   * @default "full"
   */
  variant?: "compact" | "full";
  
  /**
   * Animation index for staggered entrance
   * @default 0
   */
  animationIndex?: number;
  
  /**
   * Optional click handler (overrides default navigation)
   */
  onClick?: () => void;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * GladiatorCard component
 * 
 * A unified, reusable card component for displaying gladiator information.
 * Supports two variants: compact (for grids) and full (for detailed views).
 * 
 * @example
 * ```tsx
 * // Compact variant for dashboard grid
 * <GladiatorCard
 *   gladiator={gladiator}
 *   locale="en"
 *   translations={t}
 *   variant="compact"
 *   animationIndex={index}
 * />
 * 
 * // Full variant for gladiators page
 * <GladiatorCard
 *   gladiator={gladiator}
 *   locale="en"
 *   translations={t}
 *   variant="full"
 * />
 * ```
 */
export default function GladiatorCard({
  gladiator,
  locale,
  translations: t,
  variant = "full",
  animationIndex = 0,
  onClick,
  className = "",
}: GladiatorCardProps) {
  const router = useRouter();
  
  const healthStatus = getBasicHealthStatus(gladiator, {
    healthy: t.healthy,
    injured: t.injured,
    sick: t.sick,
  });
  const StatusIcon = healthStatus.icon;
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/${locale}/gladiator/${gladiator.id}`);
    }
  };
  
  // Calculate health percentage
  const healthPercentage = (gladiator.currentHealth / gladiator.health) * 100;
  
  // Determine health bar color based on percentage
  const getHealthBarColor = () => {
    if (gladiator.currentHealth === gladiator.health) {
      return 'bg-gradient-to-r from-green-500 to-green-600';
    } else if (gladiator.currentHealth > gladiator.health * 0.5) {
      return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
    } else {
      return 'bg-gradient-to-r from-red-500 to-red-600';
    }
  };
  
  if (variant === "compact") {
    return (
      <motion.div
        {...gladiatorCardEntrance(animationIndex)}
        onClick={handleClick}
        className={`group cursor-pointer ${className}`}
        data-testid={`gladiator-${gladiator.id}`}
      >
        <div className="relative bg-gradient-to-br from-zinc-900 to-black border border-amber-900/30 rounded-lg p-2 sm:p-2.5 hover:border-amber-700/50 transition-all duration-300 hover:shadow-lg hover:shadow-amber-900/20">
          {/* Avatar and Basic Info */}
          <div className="flex items-start gap-2">
            {/* Avatar */}
            <GladiatorAvatar
              name={gladiator.name}
              avatarUrl={gladiator.avatarUrl}
              size="sm"
              alive={gladiator.alive}
              injured={!!gladiator.injury}
            />
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-amber-400 truncate">
                {gladiator.name} {gladiator.surname}
              </h4>
              <p className="text-[0.65rem] sm:text-[10px] text-gray-400 truncate">
                {gladiator.birthCity}
              </p>
              
              {/* Health Status */}
              <div className="flex items-center gap-1 mt-1">
                <StatusIcon className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${healthStatus.color}`} />
                <span className={`text-[0.65rem] sm:text-[10px] ${healthStatus.color}`}>
                  {healthStatus.label}
                </span>
                {gladiator.injuryTimeLeftHours && (
                  <span className="text-[0.65rem] sm:text-[10px] text-gray-500">
                    ({gladiator.injuryTimeLeftHours}h)
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Health Bar */}
          <div className="mt-1.5 sm:mt-2">
            <div className="flex items-center justify-between text-[0.65rem] sm:text-[10px] mb-0.5">
              <span className="text-gray-500">{t.health}</span>
              <span className="text-gray-400">{gladiator.health} HP</span>
            </div>
            <div className="h-1 sm:h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-500"
                style={{ width: `${(gladiator.health / 300) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
  
  // Full variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={handleClick}
      className={`group cursor-pointer ${className}`}
      data-testid={`gladiator-${gladiator.id}`}
    >
      <div className="relative bg-gradient-to-br from-zinc-900 to-black border border-amber-900/30 rounded-[clamp(0.75rem,2vw,1rem)] p-[clamp(1rem,3vw,1.5rem)] hover:border-amber-700/50 transition-all duration-300 hover:shadow-lg hover:shadow-amber-900/20">
        {/* Avatar and Basic Info */}
        <div className="flex items-start gap-[clamp(0.75rem,2vw,1rem)]">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-[clamp(3.5rem,10vw,4.5rem)] h-[clamp(3.5rem,10vw,4.5rem)] rounded-full bg-gradient-to-br from-amber-600 to-red-600 flex items-center justify-center text-[clamp(1.25rem,4vw,1.75rem)] font-bold text-white">
              {gladiator.name.charAt(0)}
            </div>
            {!gladiator.alive && (
              <div className="absolute inset-0 bg-black/80 rounded-full flex items-center justify-center">
                <span className="text-red-500 text-[clamp(0.875rem,2vw,1.125rem)]">✝</span>
              </div>
            )}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="text-[clamp(0.875rem,2.5vw,1.125rem)] font-bold text-amber-400 truncate">
              {gladiator.name} {gladiator.surname}
            </h4>
            <p className="text-[clamp(0.75rem,2vw,0.875rem)] text-gray-400 truncate">
              {gladiator.birthCity}
            </p>
            
            {/* Health Status */}
            <div className="flex items-center gap-[clamp(0.5rem,1.5vw,0.75rem)] mt-[clamp(0.5rem,1.5vw,0.75rem)]">
              <StatusIcon className={`w-[clamp(0.875rem,2vw,1rem)] h-[clamp(0.875rem,2vw,1rem)] ${healthStatus.color}`} />
              <span className={`text-[clamp(0.75rem,2vw,0.875rem)] ${healthStatus.color}`}>
                {healthStatus.label}
              </span>
              {gladiator.injuryTimeLeftHours && (
                <span className="text-[clamp(0.75rem,2vw,0.875rem)] text-gray-500">
                  ({gladiator.injuryTimeLeftHours}h)
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Health Bar */}
        <div className="mt-[clamp(1rem,2.5vw,1.5rem)]">
          <div className="flex items-center justify-between text-[clamp(0.75rem,2vw,0.875rem)] mb-[clamp(0.25rem,1vw,0.5rem)]">
            <span className="text-gray-500">{t.health}</span>
            <span className="text-gray-400">{gladiator.currentHealth} / {gladiator.health} HP</span>
          </div>
          <div className="h-[clamp(0.5rem,1.5vw,0.75rem)] bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getHealthBarColor()}`}
              style={{ width: `${healthPercentage}%` }}
            />
          </div>
          <div className="text-[clamp(0.625rem,1.5vw,0.75rem)] text-gray-500 mt-[clamp(0.25rem,1vw,0.5rem)]">
            {Math.round(healthPercentage)}% health
          </div>
        </div>
        
        {/* Hover Effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-amber-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[clamp(0.75rem,2vw,1rem)] pointer-events-none" />
      </div>
    </motion.div>
  );
}

