"use client";

interface SkeletonCardProps {
  /**
   * Variant of the skeleton card
   * @default "gladiator"
   */
  variant?: "gladiator" | "arena" | "quest" | "generic";
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * SkeletonCard component
 * 
 * A reusable skeleton loader for different card types.
 * Used to show loading states while data is being fetched.
 * 
 * @example
 * ```tsx
 * // Gladiator card skeleton
 * <SkeletonCard variant="gladiator" />
 * 
 * // Arena card skeleton
 * <SkeletonCard variant="arena" />
 * 
 * // Generic card skeleton
 * <SkeletonCard variant="generic" />
 * ```
 */
export default function SkeletonCard({ variant = "gladiator", className = "" }: SkeletonCardProps) {
  if (variant === "gladiator") {
    return (
      <div
        className={`bg-black/40 backdrop-blur-sm border border-red-900/30 rounded-xl p-6 animate-pulse ${className}`}
        aria-hidden="true"
        data-testid="gladiator-skeleton"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="h-5 w-40 bg-amber-700/30 rounded mb-2"></div>
            <div className="h-3 w-24 bg-amber-700/20 rounded"></div>
          </div>
          <div className="h-12 w-12 bg-amber-700/20 rounded-full"></div>
        </div>
        
        {/* Stats skeleton */}
        <div className="space-y-2 mb-4">
          <div className="h-3 w-full bg-amber-700/20 rounded"></div>
          <div className="h-3 w-3/4 bg-amber-700/20 rounded"></div>
          <div className="h-3 w-5/6 bg-amber-700/20 rounded"></div>
        </div>
        
        {/* Health bar skeleton */}
        <div className="h-2 w-full bg-amber-700/20 rounded-full"></div>
      </div>
    );
  }

  if (variant === "arena") {
    return (
      <div
        className={`bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-xl p-4 animate-pulse ${className}`}
        aria-hidden="true"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1">
            <div className="h-6 w-48 bg-amber-700/30 rounded mb-2"></div>
            <div className="flex items-center gap-4 mb-2">
              <div className="h-4 w-32 bg-amber-700/20 rounded"></div>
              <div className="h-4 w-24 bg-amber-700/20 rounded"></div>
            </div>
            <div className="h-4 w-40 bg-amber-700/20 rounded"></div>
          </div>
          <div className="h-10 w-32 bg-amber-700/30 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (variant === "quest") {
    return (
      <div
        className={`bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-xl p-6 animate-pulse ${className}`}
        aria-hidden="true"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="h-6 w-3/4 bg-amber-700/30 rounded mb-3"></div>
            <div className="h-4 w-full bg-amber-700/20 rounded mb-2"></div>
            <div className="h-4 w-5/6 bg-amber-700/20 rounded"></div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-amber-900/30">
          <div className="h-4 w-24 bg-amber-700/20 rounded"></div>
          <div className="h-10 w-28 bg-amber-700/30 rounded-lg"></div>
        </div>
      </div>
    );
  }

  // Generic variant
  return (
    <div
      className={`bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-xl p-6 animate-pulse ${className}`}
      aria-hidden="true"
    >
      <div className="h-6 w-3/4 bg-amber-700/30 rounded mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 w-full bg-amber-700/20 rounded"></div>
        <div className="h-4 w-5/6 bg-amber-700/20 rounded"></div>
        <div className="h-4 w-4/5 bg-amber-700/20 rounded"></div>
      </div>
    </div>
  );
}

/**
 * Skeleton for a simple line of text
 */
export function SkeletonLine({
  width = "full",
  height = "4",
  className = "",
}: {
  width?: "full" | "3/4" | "1/2" | "1/3" | "1/4";
  height?: "2" | "3" | "4" | "5" | "6";
  className?: string;
}) {
  return (
    <div
      className={`h-${height} w-${width} bg-amber-700/20 rounded animate-pulse ${className}`}
      aria-hidden="true"
    />
  );
}

/**
 * Skeleton for a circular avatar
 */
export function SkeletonAvatar({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
    xl: "h-24 w-24",
  };

  return (
    <div
      className={`${sizeClasses[size]} bg-amber-700/20 rounded-full animate-pulse ${className}`}
      aria-hidden="true"
    />
  );
}

/**
 * Skeleton for a button
 */
export function SkeletonButton({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "h-8 w-20",
    md: "h-10 w-28",
    lg: "h-12 w-36",
  };

  return (
    <div
      className={`${sizeClasses[size]} bg-amber-700/30 rounded-lg animate-pulse ${className}`}
      aria-hidden="true"
    />
  );
}

