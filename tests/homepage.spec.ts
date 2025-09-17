import { test, expect } from '@playwright/test';

// Verify logout button does not appear on homepage (/, /en, /fr)

test.describe('Homepage - no logout button', () => {
  test('EN default redirect from /: no logout visible', async ({ page }) => {
    await page.goto('/');
    // Accept redirect to /en
    await expect(page).toHaveURL(/\/(|en\/?$)/);
    await expect(page.getByTestId('logout-button')).toHaveCount(0);
  });

  test('FR homepage: no logout visible', async ({ page }) => {
    await page.goto('/fr');
    await expect(page).toHaveURL(/\/fr\/?$/);
    await expect(page.getByTestId('logout-button')).toHaveCount(0);
  });
});

