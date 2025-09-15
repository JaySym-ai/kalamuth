import { test, expect } from '@playwright/test';
import { loginUser, clearAuthState, TEST_CREDENTIALS } from './helpers/auth';

// All tests assume server running on port 3000

test.describe('Home redirect when authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test('redirects authenticated user without completed onboarding to /en/onboarding', async ({ page }) => {
    await loginUser(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password, 'en');

    const res1 = await page.request.post('/api/user', { data: { onboardingDone: false } });
    expect(res1.status()).toBe(200);

    await page.goto('/en');
    await expect(page).toHaveURL(/\/en\/onboarding$/);
  });

  test('redirects authenticated user with completed onboarding to /en/dashboard', async ({ page }) => {
    await loginUser(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password, 'en');

    const res2 = await page.request.post('/api/user', { data: { onboardingDone: true } });
    expect(res2.status()).toBe(200);

    // Confirm state updated before navigating
    const resCheck = await page.request.get('/api/user');
    expect(resCheck.status()).toBe(200);
    const body = await resCheck.json();
    expect(body.onboardingDone).toBe(true);

    await page.goto('/en');
    await expect(page).toHaveURL(/\/en\/dashboard$/);

    // Basic i18n check (EN)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    // Switch to FR locale and verify redirect there as well
    await page.goto('/fr');
    await expect(page).toHaveURL(/\/fr\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();
  });
});

