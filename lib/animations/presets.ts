import type { Transition, Variants } from "framer-motion";

/**
 * Common animation presets for Framer Motion
 * 
 * These presets provide consistent animations across the app
 * and reduce code duplication.
 */

// ============================================================================
// FADE ANIMATIONS
// ============================================================================

/**
 * Simple fade in animation
 */
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/**
 * Fade in with delay
 */
export const fadeInWithDelay = (delay: number = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { delay },
});

// ============================================================================
// SLIDE ANIMATIONS
// ============================================================================

/**
 * Slide up animation (from bottom)
 */
export const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

/**
 * Slide up with delay
 */
export const slideUpWithDelay = (delay: number = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { delay },
});

/**
 * Slide down animation (from top)
 */
export const slideDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

/**
 * Slide left animation (from right)
 */
export const slideLeft = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

/**
 * Slide right animation (from left)
 */
export const slideRight = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

// ============================================================================
// SCALE ANIMATIONS
// ============================================================================

/**
 * Scale up animation (zoom in)
 */
export const scaleUp = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

/**
 * Scale down animation (zoom out)
 */
export const scaleDown = {
  initial: { opacity: 0, scale: 1.1 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1.1 },
};

// ============================================================================
// STAGGER ANIMATIONS
// ============================================================================

/**
 * Stagger children animation
 * Use with a parent container
 */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

/**
 * Stagger item animation
 * Use with children of staggerContainer
 */
export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

/**
 * Create a staggered animation with custom delay
 */
export const createStaggerAnimation = (index: number, baseDelay: number = 0.1) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: index * baseDelay },
});

// ============================================================================
// SPRING ANIMATIONS
// ============================================================================

/**
 * Spring transition (bouncy)
 */
export const springTransition: Transition = {
  type: "spring",
  stiffness: 140,
  damping: 18,
};

/**
 * Soft spring transition
 */
export const softSpringTransition: Transition = {
  type: "spring",
  stiffness: 100,
  damping: 20,
};

/**
 * Stiff spring transition
 */
export const stiffSpringTransition: Transition = {
  type: "spring",
  stiffness: 200,
  damping: 15,
};

// ============================================================================
// MODAL/OVERLAY ANIMATIONS
// ============================================================================

/**
 * Modal backdrop animation
 */
export const modalBackdrop = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/**
 * Modal content animation (scale + fade)
 */
export const modalContent = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

// ============================================================================
// CARD ANIMATIONS
// ============================================================================

/**
 * Card hover animation
 */
export const cardHover = {
  scale: 1.05,
  transition: { duration: 0.2 },
};

/**
 * Card tap animation
 */
export const cardTap = {
  scale: 0.95,
};

// ============================================================================
// HEIGHT ANIMATIONS
// ============================================================================

/**
 * Expand/collapse animation
 */
export const expandCollapse = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: "auto" },
  exit: { opacity: 0, height: 0 },
  transition: { duration: 0.3 },
};

// ============================================================================
// ROTATION ANIMATIONS
// ============================================================================

/**
 * Infinite rotation (for spinners)
 */
export const infiniteRotation = {
  animate: { rotate: 360 },
  transition: { duration: 1, repeat: Infinity, ease: "linear" },
};

/**
 * Pulse animation (for attention)
 */
export const pulse = {
  animate: { scale: [1, 1.05, 1] },
  transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
};

// ============================================================================
// GLADIATOR-SPECIFIC ANIMATIONS
// ============================================================================

/**
 * Gladiator card entrance animation
 */
export const gladiatorCardEntrance = (index: number) => ({
  initial: { opacity: 0, y: 16, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: {
    type: "spring" as const,
    stiffness: 140,
    damping: 18,
    delay: index * 0.08
  },
});

/**
 * Combat action animation
 */
export const combatAction = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

/**
 * Health bar animation
 */
export const healthBarAnimation = {
  initial: { width: 0 },
  animate: { width: "100%" },
  transition: { duration: 0.5, ease: "easeOut" },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a custom animation with specific parameters
 */
export const createAnimation = ({
  x = 0,
  y = 0,
  scale = 1,
  opacity = 1,
  delay = 0,
  duration = 0.3,
}: {
  x?: number;
  y?: number;
  scale?: number;
  opacity?: number;
  delay?: number;
  duration?: number;
}) => ({
  initial: { opacity: 0, x: -x, y: -y, scale: scale === 1 ? 0.9 : scale },
  animate: { opacity, x, y, scale },
  transition: { delay, duration },
});

