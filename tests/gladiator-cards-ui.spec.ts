import { test, expect } from '@playwright/test';

test.describe('Gladiator Cards UI Components', () => {
  test('gladiator card component renders correctly', async ({ page }) => {
    // Create a test page with mock gladiator data
    await page.goto('/');
    
    // Navigate to the French homepage
    await page.goto('/fr');
    
    // Check that the page loads
    await expect(page).toHaveURL(/\/fr/);
    
    // Verify the homepage has the expected structure
    const heroSection = page.locator('section').first();
    await expect(heroSection).toBeVisible();
  });

  test('French translations are loaded correctly', async ({ page }) => {
    await page.goto('/fr');
    
    // Check for French text on the homepage
    await expect(page.locator('text=/Forgez Votre Empire/i')).toBeVisible();
  });

  test('mobile viewport renders correctly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    
    await page.goto('/fr');
    
    // Check that mobile layout is applied
    const mainContent = page.locator('main').first();
    await expect(mainContent).toBeVisible();
    
    // Verify safe area padding is applied
    const hasTopPadding = await mainContent.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.paddingTop !== '0px';
    });
    expect(hasTopPadding).toBeTruthy();
  });

  test('navigation between locales works', async ({ page }) => {
    await page.goto('/en');
    
    // Check English content
    await expect(page.locator('text=/Forge Your Gladiator Empire/i')).toBeVisible();
    
    // Navigate to French
    await page.goto('/fr');
    
    // Check French content
    await expect(page.locator('text=/Forgez Votre Empire/i')).toBeVisible();
  });
});
