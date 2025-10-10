/**
 * Debug logging utility
 * 
 * Controls console output via DEBUG environment variable
 * - Server-side: DEBUG env var (set in .env.local)
 * - Client-side: NEXT_PUBLIC_DEBUG env var (set in .env.local)
 * 
 * Usage:
 *   import { debug_log } from '@/utils/debug';
 *   debug_log('My message', { data: 'value' });
 */

const isDebugEnabled = () => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // Client-side: check NEXT_PUBLIC_DEBUG
    return process.env.NEXT_PUBLIC_DEBUG === 'true';
  }
  // Server-side: check DEBUG
  return process.env.DEBUG === 'true';
};

/**
 * Debug log function - only logs when DEBUG is enabled
 * @param message - The message to log
 * @param data - Optional data to log
 */
export function debug_log(message: string, data?: unknown): void {
  if (isDebugEnabled()) {
    console.log(`[DEBUG] ${message}`, data ?? '');
  }
}

/**
 * Debug error function - only logs when DEBUG is enabled
 * @param message - The message to log
 * @param error - Optional error object or data
 */
export function debug_error(message: string, error?: unknown): void {
  if (isDebugEnabled()) {
    console.error(`[DEBUG ERROR] ${message}`, error ?? '');
  }
}

/**
 * Debug warn function - only logs when DEBUG is enabled
 * @param message - The message to log
 * @param data - Optional data to log
 */
export function debug_warn(message: string, data?: unknown): void {
  if (isDebugEnabled()) {
    console.warn(`[DEBUG WARN] ${message}`, data ?? '');
  }
}

/**
 * Debug info function - only logs when DEBUG is enabled
 * @param message - The message to log
 * @param data - Optional data to log
 */
export function debug_info(message: string, data?: unknown): void {
  if (isDebugEnabled()) {
    console.info(`[DEBUG INFO] ${message}`, data ?? '');
  }
}

