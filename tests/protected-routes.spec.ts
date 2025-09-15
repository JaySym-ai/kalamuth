import { test, expect } from '@playwright/test';
import { loginUser, TEST_CREDENTIALS } from './helpers/auth';

// Use shared test credentials
const TEST_EMAIL = TEST_CREDENTIALS.email;
const TEST_PASSWORD = TEST_CREDENTIALS.password;

test.describe('Protected Routes Access Control', () => {
  test.describe('Unauthenticated Access', () => {
    test('should redirect to auth page when accessing setup without authentication', async ({ page }) => {
      await page.goto('/en/server-selection');
      await expect(page).toHaveURL(/\/en\/auth/);
    });

    test('should redirect to auth page when accessing French setup without authentication', async ({ page }) => {
      await page.goto('/fr/server-selection');
      await expect(page).toHaveURL(/\/fr\/auth(\?.*)?$/);
    });

    test('should allow access to public routes without authentication', async ({ page }) => {
      // Test home page access
      await page.goto('/en');
      await expect(page).toHaveURL(/\/en/);
      
      // Test auth page access
      await page.goto('/en/auth');
      await expect(page).toHaveURL(/\/en\/auth/);
      
      // Should see login form
      await expect(page.locator('h1')).toContainText('Welcome back');
    });

    test('should handle direct API access without authentication', async ({ page }) => {
      // Try to access user API without authentication
      const response = await page.request.get('/api/user');
      expect(response.status()).toBe(401);
    });
  });

  test.describe('Authenticated Access', () => {
    test.beforeEach(async ({ page }) => {
      // Log in before each test using shared helper
      await loginUser(page);
    });

    test('should allow access to server selection when authenticated', async ({ page }) => {
      await page.goto('/en/server-selection');
      await expect(page).toHaveURL(/\/en\/server-selection/);
    });

    test('should allow access to French server selection when authenticated', async ({ page }) => {
      await page.goto('/fr/server-selection');
      await expect(page).toHaveURL(/\/fr\/server-selection/);
    });

    test('should redirect authenticated users away from auth page', async ({ page }) => {
      await page.goto('/en/auth');
      // Should be redirected away from auth page
      await expect(page).not.toHaveURL(/\/auth/);
    });

    test('should allow API access when authenticated', async ({ page }) => {
      // Access user API with authentication
      const response = await page.request.get('/api/user');
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('onboardingDone');
    });

    test('should maintain authentication across page reloads', async ({ page }) => {
      // Go to server selection page
      await page.goto('/en/server-selection');
      await expect(page).toHaveURL(/\/en\/server-selection/);

      // Reload the page
      await page.reload();

      // Should still be on server selection page (not redirected to auth)
      await expect(page).toHaveURL(/\/en\/server-selection/);
    });

    test('should maintain authentication across navigation', async ({ page }) => {
      // Start at server selection
      await page.goto('/en/server-selection');
      await expect(page).toHaveURL(/\/en\/server-selection/);

      // Navigate to home
      await page.goto('/en');
      await expect(page).toHaveURL(/\/en/);

      // Navigate back to server selection
      await page.goto('/en/server-selection');
      await expect(page).toHaveURL(/\/en\/server-selection/);
    });
  });

  test.describe('Session Management', () => {
    test('should handle session expiration gracefully', async ({ page }) => {
      // Log in
      await loginUser(page);
      
      // Clear cookies to simulate session expiration
      await page.context().clearCookies();
      
      // Try to access protected route
      await page.goto('/en/server-selection');

      // Should be redirected to auth page
      await expect(page).toHaveURL(/\/en\/auth/);
    });

    test('should handle logout and prevent access to protected routes', async ({ page }) => {
      // Log in
      await loginUser(page);
      
      // Logout
      await page.click('button:has-text("Sign out")');
      await expect(page).toHaveURL(/\/en\/?$/, { timeout: 10000 });
      
      // Try to access protected route after logout
      await page.goto('/en/server-selection');
      await expect(page).toHaveURL(/\/en\/auth/);
    });
  });

  test.describe('Internationalization with Authentication', () => {
    test('should handle authentication flow in French', async ({ page }) => {
      // Navigate to French auth page
      await page.goto('/fr/auth');
      await expect(page).toHaveURL(/\/fr\/auth/);
      
      // Should see French login form
      await expect(page.locator('h1')).toContainText('Bon retour');

      // Log in using French locale
      await loginUser(page, TEST_EMAIL, TEST_PASSWORD, 'fr');

      // Should land in French setup flow or dashboard
      await expect(page).toHaveURL(/\/fr\/(server-selection|ludus-creation|initial-gladiators|dashboard)/);
    });

    test('should maintain locale after authentication', async ({ page }) => {
      // Log in with French locale
      await loginUser(page, TEST_EMAIL, TEST_PASSWORD, 'fr');
      
      // Navigate to other pages - should maintain French locale
      await page.goto('/fr');
      await expect(page).toHaveURL(/\/fr/);
    });
  });
});
