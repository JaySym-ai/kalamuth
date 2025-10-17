/**
 * BackgroundEffects - Reusable background gradient and effects
 * 
 * Provides consistent background styling across the app with different variants
 * Includes gradient backgrounds, grid overlays, and optional arena patterns
 */

interface BackgroundEffectsProps {
  /** Background variant */
  variant?: "default" | "arena" | "hero" | "combat" | "intro";
  /** Whether to show grid overlay */
  showGrid?: boolean;
  /** Whether to show arena pattern */
  showArenaPattern?: boolean;
  /** Custom className for additional styling */
  className?: string;
}

const GRADIENT_VARIANTS = {
  default: "bg-gradient-to-b from-black via-zinc-900 to-black",
  arena: "bg-gradient-to-br from-black via-red-950/20 to-black",
  hero: "bg-gradient-to-br from-black via-red-950/20 to-black",
  combat: "bg-gradient-to-b from-black via-zinc-900 to-black",
  intro: "bg-gradient-to-br from-black via-red-950/30 to-black",
};

export default function BackgroundEffects({
  variant = "default",
  showGrid = false,
  showArenaPattern = false,
  className = "",
}: BackgroundEffectsProps) {
  const gradientClass = GRADIENT_VARIANTS[variant];

  return (
    <div className={`absolute inset-0 ${className}`}>
      {/* Main gradient background */}
      <div className={`absolute inset-0 ${gradientClass}`} />

      {/* Optional grid overlay */}
      {showGrid && (
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      )}

      {/* Optional arena pattern */}
      {showArenaPattern && (
        <div className="absolute inset-0 bg-[url('/arena-bg.svg')] opacity-5" />
      )}
    </div>
  );
}

