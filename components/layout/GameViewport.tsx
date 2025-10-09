"use client";

import { ReactNode, useEffect } from "react";

interface GameViewportProps {
  children: ReactNode;
  /**
   * Whether to allow vertical scrolling within the viewport.
   * Default: false (no scroll, content must fit)
   */
  allowScroll?: boolean;
  /**
   * Custom className for additional styling
   */
  className?: string;
}

/**
 * GameViewport - A reusable wrapper that locks the game to the device viewport
 * 
 * Features:
 * - Fills 100% of the viewport height (using dvh for mobile support)
 * - Prevents page scrolling (body/html scroll disabled)
 * - Respects safe areas (notches, home indicators)
 * - Disables native mobile scroll behaviors (bounce, overscroll)
 * - Provides a fixed container for game content
 * 
 * Usage:
 * ```tsx
 * <GameViewport>
 *   <YourGameContent />
 * </GameViewport>
 * ```
 * 
 * For pages that need internal scrolling (like lists):
 * ```tsx
 * <GameViewport>
 *   <div className="h-full flex flex-col">
 *     <header>Fixed Header</header>
 *     <div className="flex-1 overflow-y-auto">
 *       Scrollable content
 *     </div>
 *   </div>
 * </GameViewport>
 * ```
 */
export default function GameViewport({ 
  children, 
  allowScroll = false,
  className = "" 
}: GameViewportProps) {
  
  useEffect(() => {
    // Prevent body scroll and bounce effects on mobile
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalHeight = document.body.style.height;
    const originalTouchAction = document.body.style.touchAction;
    
    // Lock body scroll
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.height = "100%";
    document.body.style.width = "100%";
    document.body.style.touchAction = "none"; // Disable native touch behaviors
    
    // Also lock html element
    const htmlElement = document.documentElement;
    const originalHtmlOverflow = htmlElement.style.overflow;
    const originalHtmlHeight = htmlElement.style.height;
    const originalHtmlTouchAction = htmlElement.style.touchAction;
    
    htmlElement.style.overflow = "hidden";
    htmlElement.style.height = "100%";
    htmlElement.style.touchAction = "none";
    
    // Prevent pull-to-refresh and overscroll on mobile
    const preventOverscroll = (e: TouchEvent) => {
      // Only prevent if we're at the top/bottom of the viewport
      const target = e.target as HTMLElement;
      const isScrollable = target.closest('[data-scrollable="true"]');
      
      if (!isScrollable) {
        e.preventDefault();
      }
    };
    
    document.addEventListener("touchmove", preventOverscroll, { passive: false });
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.height = originalHeight;
      document.body.style.touchAction = originalTouchAction;
      
      htmlElement.style.overflow = originalHtmlOverflow;
      htmlElement.style.height = originalHtmlHeight;
      htmlElement.style.touchAction = originalHtmlTouchAction;
      
      document.removeEventListener("touchmove", preventOverscroll);
    };
  }, []);

  return (
    <div
      className={`
        game-viewport
        fixed inset-0
        w-full h-full
        ${allowScroll ? "overflow-y-auto" : "overflow-hidden"}
        ${className}
      `}
      style={{
        // Use dvh (dynamic viewport height) for better mobile support
        // Falls back to vh for older browsers
        height: "100dvh",
        maxHeight: "100dvh",
        // Respect safe areas
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      {children}
    </div>
  );
}

