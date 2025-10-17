/**
 * GlowOrbs - Animated background glow effects
 * 
 * Provides animated glowing orbs for background decoration
 * Supports different positions, colors, and sizes
 */

interface GlowOrbsProps {
  /** Layout variant for orb positioning */
  variant?: "default" | "diagonal" | "corners" | "center" | "scattered";
  /** Size of the orbs */
  size?: "sm" | "md" | "lg" | "xl";
  /** Custom className for additional styling */
  className?: string;
}

const SIZE_CLASSES = {
  sm: "w-48 h-48 sm:w-64 sm:h-64",
  md: "w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96",
  lg: "w-[clamp(200px,30vw,400px)] h-[clamp(200px,30vw,400px)]",
  xl: "w-[clamp(200px,50vw,800px)] h-[clamp(200px,50vw,800px)]",
};

export default function GlowOrbs({
  variant = "default",
  size = "md",
  className = "",
}: GlowOrbsProps) {
  const sizeClass = SIZE_CLASSES[size];

  // Render different layouts based on variant
  switch (variant) {
    case "diagonal":
      return (
        <div className={`absolute inset-0 ${className}`}>
          <div
            className={`absolute top-1/4 right-1/4 ${sizeClass} bg-red-600/20 rounded-full blur-3xl animate-pulse`}
          />
          <div
            className={`absolute bottom-1/4 left-1/4 ${sizeClass} bg-amber-600/20 rounded-full blur-3xl animate-pulse`}
            style={{ animationDelay: "1000ms" }}
          />
        </div>
      );

    case "corners":
      return (
        <div className={`absolute inset-0 ${className}`}>
          <div
            className={`absolute top-0 left-1/4 ${sizeClass} bg-amber-600/20 rounded-full blur-3xl animate-pulse`}
          />
          <div
            className={`absolute bottom-0 right-1/4 ${sizeClass} bg-red-600/20 rounded-full blur-3xl animate-pulse`}
            style={{ animationDelay: "1000ms" }}
          />
        </div>
      );

    case "center":
      return (
        <div className={`absolute inset-0 ${className}`}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div
              className={`${sizeClass} bg-gradient-to-r from-amber-600/20 to-red-600/20 rounded-full blur-3xl animate-pulse`}
            />
          </div>
        </div>
      );

    case "scattered":
      return (
        <div className={`absolute inset-0 ${className}`}>
          <div
            className={`absolute top-1/2 left-0 ${sizeClass} bg-amber-600/10 rounded-full blur-3xl`}
          />
          <div
            className={`absolute bottom-0 right-0 ${sizeClass} bg-red-600/10 rounded-full blur-3xl`}
          />
        </div>
      );

    case "default":
    default:
      return (
        <div className={`absolute inset-0 ${className}`}>
          <div
            className={`absolute top-1/4 left-1/4 ${sizeClass} bg-amber-600/20 rounded-full blur-3xl animate-pulse`}
          />
          <div
            className={`absolute bottom-1/4 right-1/4 ${sizeClass} bg-red-600/20 rounded-full blur-3xl animate-pulse`}
            style={{ animationDelay: "1000ms" }}
          />
        </div>
      );
  }
}

