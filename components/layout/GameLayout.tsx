"use client";

import { ReactNode } from "react";
import GameViewport from "./GameViewport";
import ScrollableContent from "./ScrollableContent";

interface GameLayoutProps {
  children: ReactNode;
  /**
   * Background gradient or image
   * Default: black to zinc-900 gradient
   */
  background?: "gradient" | "arena" | "custom" | "none";
  /**
   * Custom background className (only used when background="custom")
   */
  customBackground?: string;
  /**
   * Whether content should be scrollable
   * Default: true
   */
  scrollable?: boolean;
  /**
   * Whether to center content vertically
   * Default: false
   */
  centerContent?: boolean;
  /**
   * Container max width
   * Default: "max-w-7xl"
   */
  maxWidth?: "max-w-4xl" | "max-w-5xl" | "max-w-6xl" | "max-w-7xl" | "full";
  /**
   * Custom className for the content container
   */
  className?: string;
}

/**
 * GameLayout - A complete layout wrapper combining GameViewport with common patterns
 * 
 * This component provides a ready-to-use layout for game pages with:
 * - Viewport locking
 * - Background options
 * - Scrollable or fixed content
 * - Centered or top-aligned content
 * - Responsive container
 * 
 * Usage Examples:
 * 
 * 1. Scrollable page with gradient background:
 * ```tsx
 * <GameLayout>
 *   <YourContent />
 * </GameLayout>
 * ```
 * 
 * 2. Fixed page with centered content:
 * ```tsx
 * <GameLayout scrollable={false} centerContent>
 *   <YourContent />
 * </GameLayout>
 * ```
 * 
 * 3. Custom background:
 * ```tsx
 * <GameLayout 
 *   background="custom"
 *   customBackground="bg-red-950"
 * >
 *   <YourContent />
 * </GameLayout>
 * ```
 */
export default function GameLayout({
  children,
  background = "gradient",
  customBackground,
  scrollable = true,
  centerContent = false,
  maxWidth = "max-w-7xl",
  className = "",
}: GameLayoutProps) {
  
  // Background component based on type
  const renderBackground = () => {
    if (background === "none") return null;
    
    if (background === "custom" && customBackground) {
      return <div className={`absolute inset-0 ${customBackground}`} />;
    }
    
    if (background === "arena") {
      return (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-900 to-black" />
          <div className="absolute inset-0 bg-[url('/images/arena-bg.jpg')] opacity-5 bg-cover bg-center" />
        </>
      );
    }
    
    // Default gradient
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-900 to-black" />
    );
  };

  // Content wrapper based on scrollable/center options
  const renderContent = () => {
    const containerClasses = `
      ${maxWidth === "full" ? "w-full" : `container mx-auto ${maxWidth}`}
      px-4 py-8
      ${className}
    `;

    if (scrollable) {
      return (
        <ScrollableContent className="relative z-10">
          <div className={containerClasses}>
            {children}
          </div>
        </ScrollableContent>
      );
    }

    if (centerContent) {
      return (
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className={containerClasses}>
            {children}
          </div>
        </div>
      );
    }

    return (
      <div className="relative z-10 h-full">
        <div className={containerClasses}>
          {children}
        </div>
      </div>
    );
  };

  return (
    <GameViewport>
      {renderBackground()}
      {renderContent()}
    </GameViewport>
  );
}

