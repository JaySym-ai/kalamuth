import { test, expect } from '@playwright/test';
import { loginUser, TEST_CREDENTIALS } from './helpers/auth';

test.describe('Arena Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to dashboard
    await loginUser(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password, 'fr');
    await page.goto('/fr/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('navigates to arena detail page when clicking arena card', async ({ page }) => {
    // Click on first arena card
    const arenaCard = page.locator('[data-testid^="arena-card-"]').first();
    await expect(arenaCard).toBeVisible();
    await arenaCard.click();
    
    // Should navigate to arena detail page
    await expect(page).toHaveURL(/\/fr\/arena\/.+/);
  });

  test('displays arena details correctly', async ({ page }) => {
    // Navigate to arena detail page
    await page.goto('/fr/arena/halicara-training-grounds');
    await page.waitForLoadState('networkidle');
    
    // Check back button
    await expect(page.getByTestId('back-to-dashboard')).toBeVisible();
    
    // Check arena name is displayed
    await expect(page.locator('h1')).toContainText('Halicara Training Grounds');
    
    // Check city information
    await expect(page.getByText('Halicara')).toBeVisible();
    
    // Check combat rules section
    await expect(page.getByText('Règles de Combat')).toBeVisible();
    
    // Check enter arena button (should be disabled)
    const enterButton = page.getByTestId('enter-arena-button');
    await expect(enterButton).toBeVisible();
    await expect(enterButton).toBeDisabled();
  });

  test('navigates back to dashboard when clicking back button', async ({ page }) => {
    // Navigate to arena detail page
    await page.goto('/fr/arena/halicara-training-grounds');
    await page.waitForLoadState('networkidle');
    
    // Click back button
    await page.getByTestId('back-to-dashboard').click();
    
    // Should be back on dashboard
    await expect(page).toHaveURL('/fr/dashboard');
  });

  test('displays different combat rules for different arenas', async ({ page }) => {
    // Check non-lethal arena
    await page.goto('/fr/arena/halicara-training-grounds');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Combat Non Létal Uniquement')).toBeVisible();
    
    // Check lethal arena
    await page.goto('/fr/arena/velusia-grand-colosseum');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Combat Mortel Autorisé')).toBeVisible();
  });
});
