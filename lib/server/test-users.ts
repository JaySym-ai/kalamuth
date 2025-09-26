/**
 * Hardcoded list of email addresses that have access to testing servers.
 * These users can see and access servers marked with testingServer: true.
 */
export const TEST_USER_EMAILS = [
  "test1@hotmail.com",
  "testplay@kalamuth.com",
] as const;

/**
 * Check if a user email has access to testing servers.
 */
export function hasTestServerAccess(userEmail: string | null | undefined): boolean {
  if (!userEmail) return false;
  return TEST_USER_EMAILS.includes(userEmail as any);
}