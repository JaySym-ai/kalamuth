/**
 * GladiatorAvatar - Reusable gladiator avatar component
 * 
 * Displays a circular avatar with gradient background and optional status indicators
 * Supports different sizes and shows death/injury status overlays
 */

import Image from "next/image";

interface GladiatorAvatarProps {
  /** Gladiator's name (used for initial if no image) */
  name: string;
  /** Optional avatar image URL */
  avatarUrl?: string;
  /** Size variant */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Whether the gladiator is alive */
  alive?: boolean;
  /** Whether the gladiator is injured */
  injured?: boolean;
  /** Custom className for additional styling */
  className?: string;
}

const SIZE_CLASSES = {
  xs: "w-8 h-8 text-sm",
  sm: "w-10 h-10 sm:w-12 sm:h-12 text-sm sm:text-lg",
  md: "w-16 h-16 text-2xl",
  lg: "w-20 h-20 text-3xl",
  xl: "w-24 h-24 text-4xl",
};

const DEATH_ICON_SIZE = {
  xs: "text-[0.5rem]",
  sm: "text-[0.65rem] sm:text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-lg",
};

export default function GladiatorAvatar({
  name,
  avatarUrl,
  size = "md",
  alive = true,
  injured = false,
  className = "",
}: GladiatorAvatarProps) {
  const sizeClass = SIZE_CLASSES[size];
  const deathIconSize = DEATH_ICON_SIZE[size];

  return (
    <div className={`relative ${className}`}>
      <div
        className={`${sizeClass} rounded-full bg-gradient-to-br from-amber-600 to-red-600 flex items-center justify-center font-bold text-white overflow-hidden`}
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={name}
            fill
            className="object-cover"
          />
        ) : (
          <span>{name.charAt(0).toUpperCase()}</span>
        )}
      </div>

      {/* Death overlay */}
      {!alive && (
        <div className="absolute inset-0 bg-black/80 rounded-full flex items-center justify-center">
          <span className={`text-red-500 ${deathIconSize}`}>✝</span>
        </div>
      )}

      {/* Injury indicator */}
      {alive && injured && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-black" />
      )}
    </div>
  );
}

