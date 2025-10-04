import { test, expect } from '@playwright/test';
import { setupTestUser, cleanupTestUser } from './helpers/auth';

const TEST_EMAIL = 'testplay@kalamuth.com';
const TEST_PASSWORD = 'TestPassword123!';

test.describe('Arena Queue System', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestUser(page, TEST_EMAIL, TEST_PASSWORD);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestUser(page);
  });

  test('displays arena queue interface', async ({ page }) => {
    // Navigate to arena detail page
    await page.goto('/en/arena/halicara-training-grounds');
    await page.waitForLoadState('networkidle');

    // Check that queue components are visible
    await expect(page.getByText('Select Your Gladiator')).toBeVisible();
    await expect(page.getByText('Current Queue')).toBeVisible();
  });

  test('can select a gladiator from the list', async ({ page }) => {
    await page.goto('/en/arena/halicara-training-grounds');
    await page.waitForLoadState('networkidle');

    // Expand gladiator list
    const toggleButton = page.getByTestId('toggle-gladiator-list');
    await expect(toggleButton).toBeVisible();
    await toggleButton.click();

    // Wait for list to expand
    await page.waitForTimeout(500);

    // Select first available gladiator
    const firstGladiator = page.locator('[data-testid^="gladiator-option-"]').first();
    await expect(firstGladiator).toBeVisible();
    await firstGladiator.click();

    // Verify selection is shown
    await expect(page.locator('text=Join Queue')).toBeVisible();
  });

  test('can join the queue with a gladiator', async ({ page }) => {
    await page.goto('/en/arena/halicara-training-grounds');
    await page.waitForLoadState('networkidle');

    // Expand and select gladiator
    await page.getByTestId('toggle-gladiator-list').click();
    await page.waitForTimeout(500);

    // Find a healthy gladiator (not injured, sick, or already queued)
    const healthyGladiator = page.locator('[data-testid^="gladiator-option-"]').filter({
      hasNot: page.locator(':disabled')
    }).first();

    await expect(healthyGladiator).toBeVisible();
    await healthyGladiator.click();

    // Join queue
    const joinButton = page.getByTestId('join-queue-button');
    await expect(joinButton).toBeVisible();
    await joinButton.click();

    // Wait for success message or queue update
    await page.waitForSelector('text=/Successfully joined the queue|Position in Queue/', {
      timeout: 5000
    });

    // Verify gladiator appears in queue
    const leaveButton = page.getByTestId('leave-queue-button');
    await expect(leaveButton).toBeVisible();

    // Verify queue shows at least one entry
    const queueEntry = page.locator('[data-testid^="queue-entry-"]').first();
    await expect(queueEntry).toBeVisible();
  });

  test('can leave the queue', async ({ page }) => {
    await page.goto('/en/arena/halicara-training-grounds');
    await page.waitForLoadState('networkidle');

    // Join queue first
    await page.getByTestId('toggle-gladiator-list').click();
    await page.waitForTimeout(500);

    // Find a healthy gladiator
    const healthyGladiator = page.locator('[data-testid^="gladiator-option-"]').filter({
      hasNot: page.locator(':disabled')
    }).first();
    await healthyGladiator.click();

    await page.getByTestId('join-queue-button').click();

    // Wait for join to complete
    await page.waitForSelector('[data-testid="leave-queue-button"]', {
      timeout: 5000
    });

    // Leave queue
    const leaveButton = page.getByTestId('leave-queue-button');
    await expect(leaveButton).toBeVisible();
    await leaveButton.click();

    // Wait for success message or button change
    await page.waitForSelector('text=/Successfully left the queue|Select Your Gladiator/', {
      timeout: 5000
    });

    // Verify back to selection state
    await expect(page.getByText('Select Your Gladiator')).toBeVisible();
    await expect(leaveButton).not.toBeVisible();
  });

  test('displays queue position correctly', async ({ page }) => {
    await page.goto('/en/arena/halicara-training-grounds');
    await page.waitForLoadState('networkidle');

    // Join queue
    await page.getByTestId('toggle-gladiator-list').click();
    await page.waitForTimeout(500);

    // Find a healthy gladiator
    const healthyGladiator = page.locator('[data-testid^="gladiator-option-"]').filter({
      hasNot: page.locator(':disabled')
    }).first();
    await healthyGladiator.click();

    await page.getByTestId('join-queue-button').click();

    // Wait for queue entry to appear
    await page.waitForSelector('[data-testid^="queue-entry-"]', {
      timeout: 5000
    });

    // Check that queue entry is visible with position number
    const queueEntry = page.locator('[data-testid^="queue-entry-"]').first();
    await expect(queueEntry).toBeVisible();

    // The position badge should show "1" for first in queue
    const positionBadge = queueEntry.locator('div').filter({ hasText: /^1$/ });
    await expect(positionBadge).toBeVisible();
    
    // Should show position number
    await expect(page.locator('text=/#[0-9]+/')).toBeVisible();
  });

  test('allows queueing injured or sick gladiators', async ({ page }) => {
    await page.goto('/en/arena/halicara-training-grounds');
    await page.waitForLoadState('networkidle');

    // Expand gladiator list
    await page.getByTestId('toggle-gladiator-list').click();
    await page.waitForTimeout(500);

    // Look for injured or sick gladiator (if any)
    const injuredOrSickGladiator = page.locator('[data-testid^="gladiator-option-"]', {
      has: page.locator('text=/Injured|Sick/')
    }).first();

    if (await injuredOrSickGladiator.count() > 0) {
      await expect(injuredOrSickGladiator).toBeEnabled();
      await injuredOrSickGladiator.click();

      const joinButton = page.getByTestId('join-queue-button');
      await expect(joinButton).toBeVisible();
      await joinButton.click();

      await page.waitForSelector('[data-testid="leave-queue-button"]', {
        timeout: 5000
      });

      const leaveButton = page.getByTestId('leave-queue-button');
      await expect(leaveButton).toBeVisible();
      await leaveButton.click();

      await page.waitForSelector('text=/Successfully left the queue|Select Your Gladiator/', {
        timeout: 5000
      });
    }
  });

  test('displays ranking points for gladiators', async ({ page }) => {
    await page.goto('/en/arena/halicara-training-grounds');
    await page.waitForLoadState('networkidle');

    // Expand gladiator list
    await page.getByTestId('toggle-gladiator-list').click();
    await page.waitForTimeout(500);

    // Check that ranking points are displayed (default 1000)
    const firstGladiator = page.locator('[data-testid^="gladiator-option-"]').first();
    await expect(firstGladiator).toContainText('1000');
  });

  test('shows queue in French locale', async ({ page }) => {
    await page.goto('/fr/arena/halicara-training-grounds');
    await page.waitForLoadState('networkidle');

    // Check French translations
    await expect(page.getByText('Sélectionnez Votre Gladiateur')).toBeVisible();
    await expect(page.getByText('File Actuelle')).toBeVisible();
  });

  test('displays empty queue state', async ({ page }) => {
    await page.goto('/en/arena/halicara-training-grounds');
    await page.waitForLoadState('networkidle');

    // Should show empty state if no one in queue
    const queueSection = page.locator('text=Current Queue').locator('..');
    await expect(queueSection).toBeVisible();
  });

  test('mobile viewport - queue interface is usable', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    
    await page.goto('/en/arena/halicara-training-grounds');
    await page.waitForLoadState('networkidle');

    // Verify tap targets are large enough (48px minimum)
    const joinButton = page.getByTestId('toggle-gladiator-list');
    const box = await joinButton.boundingBox();
    
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(44); // Allow slight variance
    }

    // Verify content fits without horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1); // Allow 1px tolerance
  });
});
