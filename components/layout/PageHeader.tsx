"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface PageHeaderProps {
  /**
   * Main title of the page
   */
  title: string;

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
   * Can be a path to an image or a React component
   */
  icon?: string | ReactNode;

  /**
   * Optional right-side actions (e.g., logout button)
   */
  rightActions?: ReactNode;

  /**
   * Optional custom className for the header
   */
  className?: string;

  /**
   * Whether to show back button
   */
  showBackButton?: boolean;
}

/**
 * PageHeader - A consistent, reusable header component for all game pages
 * 
 * Features:
 * - Mobile-first responsive design
 * - Consistent sizing and spacing
 * - Optional back button
 * - Optional icon
 * - Optional subtitle
 * - Optional right-side actions
 * 
 * Usage:
 * ```tsx
 * <PageHeader
 *   title="Dashboard"
 *   subtitle="Manage your ludus"
 *   backHref="/dashboard"
 *   icon="/assets/icon/dashboard.png"
 *   rightActions={<LogoutButton />}
 * />
 * ```
 */
export default function PageHeader({
  title,
  subtitle,
  backHref,
  icon,
  rightActions,
  className = "",
  showBackButton = !!backHref,
}: PageHeaderProps) {
  return (
    <header
      className={`max-w-7xl mx-auto mb-[clamp(1.5rem,4vw,2.5rem)] ${className}`}
      role="banner"
    >
      {/* Back button and title row */}
      <div className="flex items-center justify-between gap-[clamp(0.75rem,2vw,1rem)]">
        {/* Left: Back button + Title */}
        <div className="flex items-center gap-[clamp(0.75rem,2vw,1rem)] min-w-0 flex-1">
          {/* Back Button */}
          {showBackButton && backHref && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-shrink-0"
            >
              <Link
                href={backHref}
                className="inline-flex items-center justify-center p-[clamp(0.5rem,1.5vw,0.75rem)] bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-lg hover:border-amber-600/60 hover:bg-amber-900/10 transition-all duration-300 hover:scale-105"
                aria-label="Go back"
                data-testid="page-header-back-button"
              >
                <ArrowLeft className="w-[clamp(1.25rem,3vw,1.5rem)] h-[clamp(1.25rem,3vw,1.5rem)] text-amber-400" />
              </Link>
            </motion.div>
          )}

          {/* Title with optional icon */}
          <div className="min-w-0 flex-1 flex items-center gap-[clamp(0.5rem,1.5vw,0.75rem)]">
            {/* Icon */}
            {icon && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="flex-shrink-0"
              >
                {typeof icon === "string" ? (
                  <Image
                    src={icon}
                    width={32}
                    height={32}
                    alt="Page icon"
                    className="w-[clamp(1.5rem,4vw,2rem)] h-[clamp(1.5rem,4vw,2rem)]"
                  />
                ) : (
                  icon
                )}
              </motion.div>
            )}

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[clamp(1.5rem,5vw,2.25rem)] font-black bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 bg-clip-text text-transparent truncate"
              data-testid="page-header-title"
            >
              {title}
            </motion.h1>
          </div>
        </div>

        {/* Right: Actions */}
        {rightActions && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-shrink-0"
          >
            {rightActions}
          </motion.div>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-[clamp(0.875rem,2vw,1rem)] text-gray-400 mt-[clamp(0.5rem,1.5vw,0.75rem)]"
          data-testid="page-header-subtitle"
        >
          {subtitle}
        </motion.p>
      )}
    </header>
  );
}

