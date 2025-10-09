"use client";

import { ReactNode } from "react";

interface ScrollableContentProps {
  children: ReactNode;
  /**
   * Custom className for additional styling
   */
  className?: string;
  /**
   * Whether to show a custom scrollbar (default: true)
   */
  customScrollbar?: boolean;
}

/**
 * ScrollableContent - A helper component for scrollable areas within GameViewport
 * 
 * Features:
 * - Properly configured for touch scrolling on mobile
 * - Includes data-scrollable attribute for GameViewport
 * - Optional custom scrollbar styling
 * - Handles overscroll behavior
 * 
 * Usage:
 * ```tsx
 * <GameViewport>
 *   <ScrollableContent>
 *     <YourContent />
 *   </ScrollableContent>
 * </GameViewport>
 * ```
 */
export default function ScrollableContent({ 
  children, 
  className = "",
  customScrollbar = true
}: ScrollableContentProps) {
  return (
    <div
      className={`
        h-full overflow-y-auto
        ${customScrollbar ? "custom-scrollbar" : ""}
        ${className}
      `}
      data-scrollable="true"
      style={{
        // Smooth scrolling on iOS
        WebkitOverflowScrolling: "touch",
        // Prevent overscroll from affecting parent
        overscrollBehavior: "contain",
      }}
    >
      {children}
    </div>
  );
}

