/**
 * Time formatting utilities
 * Centralized time formatting functions used across the application
 */

/**
 * Format seconds as MM:SS
 * @param seconds - Number of seconds to format
 * @returns Formatted time string (e.g., "05:42")
 * 
 * @example
 * formatDuration(342) // "5:42"
 * formatDuration(65) // "1:05"
 * formatDuration(5) // "0:05"
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format seconds as MM:SS with zero-padded minutes
 * @param seconds - Number of seconds to format
 * @returns Formatted time string with padded minutes (e.g., "05:42")
 * 
 * @example
 * formatDurationPadded(342) // "05:42"
 * formatDurationPadded(65) // "01:05"
 * formatDurationPadded(5) // "00:05"
 */
export function formatDurationPadded(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format relative time (e.g., "5 mins ago")
 * @param timestamp - ISO timestamp string or Date object
 * @returns Human-readable relative time string
 * 
 * @example
 * formatRelativeTime("2024-01-01T12:00:00Z") // "5 mins ago" (if current time is 12:05)
 * formatRelativeTime(new Date()) // "Just now"
 */
export function formatRelativeTime(timestamp: string | Date): string {
  const now = new Date();
  const then = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins === 1) return "1 min ago";
  if (diffMins < 60) return `${diffMins} mins ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return "1 hour ago";
  if (diffHours < 24) return `${diffHours} hours ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}

/**
 * Format timestamp as HH:MM (24-hour format)
 * @param value - ISO timestamp string or undefined
 * @returns Formatted time string or "—" if invalid
 * 
 * @example
 * formatTimestamp("2024-01-01T14:30:00Z") // "14:30" (or "2:30 PM" depending on locale)
 * formatTimestamp(undefined) // "—"
 * formatTimestamp("invalid") // "—"
 */
export function formatTimestamp(value: string | undefined): string {
  if (!value) return "—";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

/**
 * Calculate time remaining until a deadline
 * @param deadline - ISO timestamp string of the deadline
 * @returns Number of seconds remaining (0 if deadline has passed)
 * 
 * @example
 * getTimeRemaining("2024-01-01T12:05:00Z") // 300 (if current time is 12:00)
 * getTimeRemaining("2024-01-01T11:55:00Z") // 0 (deadline passed)
 */
export function getTimeRemaining(deadline: string): number {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffMs = deadlineDate.getTime() - now.getTime();
  return Math.max(0, Math.floor(diffMs / 1000));
}

