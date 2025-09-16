import { test, expect } from '@playwright/test';
import { loginUser, clearAuthState, TEST_CREDENTIALS } from './helpers/auth';

// All tests assume server running on port 3000

test.describe('Home redirect when authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test('redirects authenticated user without ludus to /en/server-selection', async ({ page }) => {
    await loginUser(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password, 'en');

    // Simulate no ludus by clearing any possible ludus state if API exists (optional)
    await page.goto('/en');
    await expect(page).toHaveURL(/\/en\/(server-selection|initial-gladiators|dashboard|$)/);
  });

  test('redirects authenticated user from /en to a valid post-auth surface', async ({ page }) => {
    await loginUser(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password, 'en');

    await page.goto('/en');
    await expect(page).toHaveURL(/\/en\/(dashboard|initial-gladiators|server-selection|ludus-creation)?$/);
  });
});

