"use client";

import { ReactNode } from "react";
import GameViewport from "./GameViewport";
import ScrollableContent from "./ScrollableContent";
import PageHeader from "./PageHeader";

interface PageLayoutProps {
  /**
   * Page title (required)
   */
  title: string;

  /**
   * Page content (required)
   */
  children: ReactNode;

  /**
   * Optional subtitle
   */
  subtitle?: string;

  /**
   * Optional back button href
   */
  backHref?: string;

  /**
   * Optional icon to display next to title
   */
  icon?: string | ReactNode;

  /**
   * Optional right-side actions (e.g., logout button)
   */
  rightActions?: ReactNode;

  /**
   * Background gradient or image
   * Default: "gradient"
   */
  background?: "gradient" | "arena" | "custom" | "none";

  /**
   * Custom background className (only used when background="custom")
   */
  customBackground?: string;

  /**
   * Container max width
   * Default: "max-w-7xl"
   */
  maxWidth?: "max-w-4xl" | "max-w-5xl" | "max-w-6xl" | "max-w-7xl" | "full";

  /**
   * Custom className for the content container
   */
  className?: string;

  /**
   * Whether to show back button
   */
  showBackButton?: boolean;
}

/**
 * PageLayout - A complete layout wrapper for game pages with consistent header
 * 
 * Combines GameViewport with PageHeader for a unified page structure.
 * 
 * Features:
 * - Consistent header across all pages
 * - Mobile-first responsive design
 * - Viewport locking
 * - Scrollable content
 * - Background options
 * 
 * Usage:
 * ```tsx
 * <PageLayout
 *   title="Dashboard"
 *   subtitle="Manage your ludus"
 *   backHref="/dashboard"
 *   icon="/assets/icon/dashboard.png"
 *   rightActions={<LogoutButton />}
 * >
 *   <YourContent />
 * </PageLayout>
 * ```
 */
export default function PageLayout({
  title,
  children,
  subtitle,
  backHref,
  icon,
  rightActions,
  background = "gradient",
  customBackground,
  maxWidth = "max-w-7xl",
  className = "",
  showBackButton = !!backHref,
}: PageLayoutProps) {
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

  return (
    <GameViewport>
      {/* Background Effects */}
      {renderBackground()}

      {/* Scrollable Content Container */}
      <ScrollableContent className="relative z-10">
        <div
          className={`
            ${maxWidth === "full" ? "w-full" : `container mx-auto ${maxWidth}`}
            px-[clamp(0.75rem,3vw,1.5rem)] py-[clamp(0.75rem,3vw,1.5rem)]
            ${className}
          `}
        >
          {/* Page Header */}
          <PageHeader
            title={title}
            subtitle={subtitle}
            backHref={backHref}
            icon={icon}
            rightActions={rightActions}
            showBackButton={showBackButton}
          />

          {/* Page Content */}
          {children}
        </div>
      </ScrollableContent>
    </GameViewport>
  );
}

