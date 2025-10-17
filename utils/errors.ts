/**
 * Serialize an error to a string for logging or display
 */
export function serializeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && error !== null) {
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
  return String(error);
}

/**
 * Get current ISO timestamp
 */
export function nowIso(): string {
  return new Date().toISOString();
}
