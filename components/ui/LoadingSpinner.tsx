"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  /**
   * Size variant of the spinner
   * @default "md"
   */
  size?: "sm" | "md" | "lg" | "xl";
  
  /**
   * Color variant of the spinner
   * @default "amber"
   */
  color?: "amber" | "red" | "green" | "blue" | "white";
  
  /**
   * Optional label text to display below the spinner
   */
  label?: string;
  
  /**
   * Whether to show the spinner with a pulsing animation
   * @default false
   */
  pulse?: boolean;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Whether to center the spinner in its container
   * @default false
   */
  centered?: boolean;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

const colorClasses = {
  amber: "text-amber-400 border-amber-400",
  red: "text-red-400 border-red-400",
  green: "text-green-400 border-green-400",
  blue: "text-blue-400 border-blue-400",
  white: "text-white border-white",
};

const labelSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-lg",
};

/**
 * LoadingSpinner component
 * 
 * A reusable loading spinner with multiple size and color variants.
 * Can be used with or without a label.
 * 
 * @example
 * ```tsx
 * // Simple spinner
 * <LoadingSpinner />
 * 
 * // With label
 * <LoadingSpinner label="Loading gladiators..." />
 * 
 * // Large red spinner
 * <LoadingSpinner size="lg" color="red" />
 * 
 * // Centered with pulse
 * <LoadingSpinner centered pulse label="Please wait..." />
 * ```
 */
export default function LoadingSpinner({
  size = "md",
  color = "amber",
  label,
  pulse = false,
  className = "",
  centered = false,
}: LoadingSpinnerProps) {
  const spinnerContent = (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className={pulse ? "animate-pulse" : ""}
      >
        <Loader2 className={`${sizeClasses[size]} ${colorClasses[color]}`} />
      </motion.div>
      {label && (
        <span className={`${colorClasses[color]} ${labelSizeClasses[size]} font-medium`}>
          {label}
        </span>
      )}
    </div>
  );

  if (centered) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
}

/**
 * Simple circular spinner (alternative style)
 */
export function CircularSpinner({
  size = "md",
  color = "amber",
  className = "",
}: Pick<LoadingSpinnerProps, "size" | "color" | "className">) {
  const sizeMap = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-2",
    xl: "h-16 w-16 border-4",
  };

  return (
    <div
      className={`animate-spin rounded-full ${sizeMap[size]} border-b-${color}-400 ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

/**
 * Bouncing dots loader
 */
export function BouncingDots({
  color = "amber",
  className = "",
}: Pick<LoadingSpinnerProps, "color" | "className">) {
  const dotColor = {
    amber: "bg-amber-500",
    red: "bg-red-500",
    green: "bg-green-500",
    blue: "bg-blue-500",
    white: "bg-white",
  };

  return (
    <div className={`flex items-center justify-center space-x-3 ${className}`}>
      <div className={`w-3 h-3 ${dotColor[color]} rounded-full animate-bounce`} />
      <div
        className={`w-3 h-3 ${dotColor[color]} rounded-full animate-bounce`}
        style={{ animationDelay: "0.2s" }}
      />
      <div
        className={`w-3 h-3 ${dotColor[color]} rounded-full animate-bounce`}
        style={{ animationDelay: "0.4s" }}
      />
    </div>
  );
}

/**
 * Pulsing icon loader
 */
export function PulsingIcon({
  icon: Icon,
  size = "md",
  color = "amber",
  className = "",
}: {
  icon: React.ComponentType<{ className?: string }>;
  size?: LoadingSpinnerProps["size"];
  color?: LoadingSpinnerProps["color"];
  className?: string;
}) {
  return (
    <motion.div
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      className={className}
    >
      <Icon className={`${sizeClasses[size]} ${colorClasses[color]}`} />
    </motion.div>
  );
}

