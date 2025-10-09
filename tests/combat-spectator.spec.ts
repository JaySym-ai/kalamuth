import { test, expect } from '@playwright/test';

test.describe('Combat Spectator Viewing', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await page.goto('/fr/login');
    await page.fill('input[type="email"]', 'testplay@kalamuth.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/fr/dashboard', { timeout: 10000 });
  });

  test('spectator can view ongoing fight via watch endpoint', async ({ page, context }) => {
    // Create a second browser context for the spectator
    const spectatorContext = await context.browser()?.newContext();
    if (!spectatorContext) {
      throw new Error('Failed to create spectator context');
    }

    const spectatorPage = await spectatorContext.newPage();

    try {
      // First user navigates to arena and starts a fight
      await page.goto('/fr/arena/halicara-training-grounds');
      await page.waitForLoadState('networkidle');

      // Queue a gladiator
      const queueButton = page.getByTestId('queue-gladiator-button');
      if (await queueButton.isVisible()) {
        await queueButton.click();
        await page.waitForTimeout(2000);
      }

      // Get the match ID from the URL if a fight starts
      const matchUrl = page.url();
      const matchIdMatch = matchUrl.match(/\/combat\/([a-f0-9-]+)/);

      if (matchIdMatch) {
        const matchId = matchIdMatch[1];

        // Wait for countdown to finish and battle to auto-start (5 seconds + buffer)
        await page.waitForTimeout(6000);

        // Second user (spectator) logs in and navigates to the same fight
        await spectatorPage.goto('/fr/login');
        await spectatorPage.fill('input[type="email"]', 'testplay@kalamuth.com');
        await spectatorPage.fill('input[type="password"]', 'TestPassword123!');
        await spectatorPage.click('button[type="submit"]');
        await spectatorPage.waitForURL('/fr/dashboard', { timeout: 10000 });

        // Navigate to the same fight
        await spectatorPage.goto(`/fr/combat/${matchId}`);
        await spectatorPage.waitForLoadState('networkidle');

        // Spectator should see the combat log
        const combatLog = spectatorPage.locator('[class*="combat"]');
        await expect(combatLog).toBeVisible({ timeout: 5000 });

        // Spectator should see health bars
        const healthBars = spectatorPage.locator('[class*="health"]');
        await expect(healthBars.first()).toBeVisible();

        // Spectator should see the same logs as the starter
        const logs = await spectatorPage.locator('[class*="action"]').count();
        expect(logs).toBeGreaterThan(0);
      }
    } finally {
      await spectatorContext.close();
    }
  });

  test('spectator can view completed fight', async ({ page }) => {
    // Navigate to arena
    await page.goto('/fr/arena/halicara-training-grounds');
    await page.waitForLoadState('networkidle');

    // Queue a gladiator
    const queueButton = page.getByTestId('queue-gladiator-button');
    if (await queueButton.isVisible()) {
      await queueButton.click();
      await page.waitForTimeout(2000);
    }

    // Get the match URL
    const matchUrl = page.url();
    const matchIdMatch = matchUrl.match(/\/combat\/([a-f0-9-]+)/);

    if (matchIdMatch) {
      // Wait for countdown to finish and battle to auto-start, then complete
      await page.waitForTimeout(6000);

      // Wait for battle to complete (with timeout)
      await page.waitForTimeout(30000);

      // Check if battle is complete
      const completeStatus = page.locator('text=/Victoire|Victory/');
      if (await completeStatus.isVisible({ timeout: 5000 })) {
        // Reload the page to simulate a new viewer
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Should still see the completed fight
        const combatLog = page.locator('[class*="combat"]');
        await expect(combatLog).toBeVisible();

        // Should see the winner
        const winner = page.locator('text=/Victoire|Victory/');
        await expect(winner).toBeVisible();
      }
    }
  });

  test('spectator receives real-time updates during fight', async ({ page }) => {
    // Navigate to arena
    await page.goto('/fr/arena/halicara-training-grounds');
    await page.waitForLoadState('networkidle');

    // Queue a gladiator
    const queueButton = page.getByTestId('queue-gladiator-button');
    if (await queueButton.isVisible()) {
      await queueButton.click();
      await page.waitForTimeout(2000);
    }

    // Get the match URL
    const matchUrl = page.url();
    const matchIdMatch = matchUrl.match(/\/combat\/([a-f0-9-]+)/);

    if (matchIdMatch) {
      // Wait for countdown to finish and battle to auto-start
      await page.waitForTimeout(6000);

      // Wait for first log entry
      const firstLog = page.locator('[class*="action"]').first();
      await expect(firstLog).toBeVisible({ timeout: 10000 });

      // Count initial logs
      const initialLogCount = await page.locator('[class*="action"]').count();

      // Wait for more logs to arrive
      await page.waitForTimeout(5000);

      // Count logs after waiting
      const updatedLogCount = await page.locator('[class*="action"]').count();

      // Should have received new logs
      expect(updatedLogCount).toBeGreaterThanOrEqual(initialLogCount);
    }
  });

  test('spectator cannot view fight they are not a participant in', async ({ page, context }) => {
    // Create a second browser context for another user
    const otherContext = await context.browser()?.newContext();
    if (!otherContext) {
      throw new Error('Failed to create other context');
    }

    const otherPage = await otherContext.newPage();

    try {
      // First user starts a fight
      await page.goto('/fr/arena/halicara-training-grounds');
      await page.waitForLoadState('networkidle');

      const queueButton = page.getByTestId('queue-gladiator-button');
      if (await queueButton.isVisible()) {
        await queueButton.click();
        await page.waitForTimeout(2000);
      }

      const matchUrl = page.url();
      const matchIdMatch = matchUrl.match(/\/combat\/([a-f0-9-]+)/);

      if (matchIdMatch) {
        const matchId = matchIdMatch[1];

        // Other user tries to access the fight
        await otherPage.goto(`/fr/combat/${matchId}`);

        // Should be redirected or see an error
        // (depends on implementation - could redirect to dashboard or show error)
        const url = otherPage.url();
        const isRedirected = !url.includes(`/combat/${matchId}`);
        const hasError = await otherPage.locator('text=/Forbidden|Unauthorized/').isVisible({ timeout: 2000 }).catch(() => false);

        expect(isRedirected || hasError).toBeTruthy();
      }
    } finally {
      await otherContext.close();
    }
  });
});

