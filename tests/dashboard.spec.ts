import { test, expect } from '@playwright/test';
import { loginUser, TEST_CREDENTIALS } from './helpers/auth';

// Focus: dashboard logout button presence and behavior in FR locale

test.describe('Dashboard (FR) - Logout button', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password, 'fr');
  });

  test('shows logout button on /fr/dashboard', async ({ page }) => {
    await page.goto('/fr/dashboard');
    await expect(page.getByTestId('logout-button')).toBeVisible();
  });

  test('can logout from /fr/dashboard and redirect to /fr', async ({ page }) => {
    await page.goto('/fr/dashboard');
    await page.getByTestId('logout-button').click();
    // Accept both /fr and /fr/ as valid
    await expect(page).toHaveURL(/\/fr\/?$/, { timeout: 15000 });
  });
});

