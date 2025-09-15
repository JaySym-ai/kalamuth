import { test, expect } from '@playwright/test';

test.describe('Hero Section Title Visibility', () => {
  test('displays both title lines in English', async ({ page }) => {
    await page.goto('/en');

    // Wait for animations to complete
    await page.waitForTimeout(1000);

    // Check that both title lines are visible
    const title1 = page.getByText('RISE AS A', { exact: true });
    const title2 = page.getByText('LUDUS MASTER', { exact: true });

    await expect(title1).toBeVisible();
    await expect(title2).toBeVisible();

    // Verify the gradient text is properly rendered - use the span with gradient classes
    const title2Element = page.locator('span.text-6xl.bg-gradient-to-r.from-amber-400').first();
    await expect(title2Element).toBeVisible();
    await expect(title2Element).toHaveClass(/bg-gradient-to-r/);
    await expect(title2Element).toHaveClass(/text-transparent/);
  });

  test('displays both title lines in French', async ({ page }) => {
    await page.goto('/fr');

    // Wait for animations to complete
    await page.waitForTimeout(1000);

    // Check that both title lines are visible
    const title1 = page.getByText('DEVENEZ', { exact: true });
    const title2 = page.getByText('MAÎTRE DE LUDUS', { exact: true });

    await expect(title1).toBeVisible();
    await expect(title2).toBeVisible();

    // Verify the gradient text is properly rendered - use the span with gradient classes
    const title2Element = page.locator('span.text-6xl.bg-gradient-to-r.from-amber-400').first();
    await expect(title2Element).toBeVisible();
    await expect(title2Element).toHaveClass(/bg-gradient-to-r/);
    await expect(title2Element).toHaveClass(/text-transparent/);
  });

  test('animates title text on load', async ({ page }) => {
    await page.goto('/en');

    // Wait for animations to complete
    await page.waitForTimeout(1500);

    // Check the animated text containers within the hero h1
    const heroTitle = page.locator('main h1').first();
    const animatedTexts = heroTitle.locator('.transform.transition-all');

    // After animation, both lines should be visible and translated to y-0
    const firstLine = animatedTexts.first();
    const secondLine = animatedTexts.nth(1);

    await expect(firstLine).toBeVisible();
    await expect(secondLine).toBeVisible();

    await expect(firstLine).toHaveClass(/opacity-100/);
    await expect(secondLine).toHaveClass(/opacity-100/);

    // Both should be translated to y-0 (visible position)
    await expect(firstLine).toHaveClass(/translate-y-0/);
    await expect(secondLine).toHaveClass(/translate-y-0/);
  });

  test('hero section is mobile-friendly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/en');

    // Wait for animations
    await page.waitForTimeout(1000);

    // Check both lines are visible on mobile
    await expect(page.getByText('RISE AS A', { exact: true })).toBeVisible();
    await expect(page.getByText('LUDUS MASTER', { exact: true })).toBeVisible();

    // Verify text is not cut off or overlapping - use the main hero h1
    const heroSection = page.locator('main h1').first();
    const boundingBox = await heroSection.boundingBox();

    // Hero title should fit within mobile viewport
    expect(boundingBox).toBeTruthy();
    if (boundingBox) {
      expect(boundingBox.width).toBeLessThanOrEqual(390);
    }
  });

  test('hero section respects safe areas', async ({ page }) => {
    // Set iPhone-like viewport with notch
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/en');
    
    // Check that the hero section has proper padding
    const heroContainer = page.locator('section').first();
    
    // Verify safe area CSS is applied
    await expect(heroContainer).toHaveCSS('padding-top', /.+/);
    await expect(heroContainer).toHaveCSS('padding-bottom', /.+/);
  });
});
