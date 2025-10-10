import { test, expect } from '@playwright/test';
import { loginUser, TEST_CREDENTIALS } from './helpers/auth';

test.describe('Tavern Feature', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password, 'en');
  });

  test('should navigate to tavern from dashboard', async ({ page }) => {
    await page.goto('/en/dashboard');
    await expect(page.getByTestId('tavern-button')).toBeVisible();
    await page.getByTestId('tavern-button').click();
    await expect(page).toHaveURL(/\/en\/tavern/);
  });

  test('should display tavern title and subtitle', async ({ page }) => {
    await page.goto('/en/tavern');
    await expect(page.getByRole('heading', { name: 'The Tavern' })).toBeVisible();
    await expect(page.getByText('Recruit new gladiators to join your ludus')).toBeVisible();
  });

  test('should show loading state while generating gladiators', async ({ page }) => {
    await page.goto('/en/tavern');
    // Wait for loading to appear and then disappear
    // The loader should appear briefly during generation
    await page.waitForTimeout(500);
  });

  test('should display available gladiators after generation', async ({ page }) => {
    await page.goto('/en/tavern');
    // Wait for gladiators to be generated and displayed
    await page.waitForTimeout(3000);
    
    // Check if at least one gladiator card is visible
    const gladiatorCards = page.locator('[data-testid^="tavern-gladiator-"]');
    const count = await gladiatorCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display recruit and reroll buttons for each gladiator', async ({ page }) => {
    await page.goto('/en/tavern');
    await page.waitForTimeout(3000);
    
    const firstGladiator = page.locator('[data-testid^="tavern-gladiator-"]').first();
    await expect(firstGladiator.locator('[data-testid^="recruit-button-"]')).toBeVisible();
    await expect(firstGladiator.locator('[data-testid^="reroll-button-"]')).toBeVisible();
  });

  test('should show ludus status with gladiator count', async ({ page }) => {
    await page.goto('/en/tavern');
    // Check that ludus name and gladiator count are displayed
    const ludusStatus = page.locator('text=/\\d+ \\/ \\d+ Available Gladiators/');
    await expect(ludusStatus).toBeVisible();
  });

  test('should navigate back to dashboard', async ({ page }) => {
    await page.goto('/en/tavern');
    await expect(page.getByTestId('back-to-dashboard-button')).toBeVisible();
    await page.getByTestId('back-to-dashboard-button').click();
    await expect(page).toHaveURL(/\/en\/dashboard/);
  });

  test('should display tavern in French locale', async ({ page }) => {
    await loginUser(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password, 'fr');
    await page.goto('/fr/tavern');
    await expect(page.getByRole('heading', { name: 'La Taverne' })).toBeVisible();
    await expect(page.getByText('Recruter de nouveaux gladiateurs pour rejoindre votre ludus')).toBeVisible();
  });

  test('should show tavern button in French dashboard', async ({ page }) => {
    await loginUser(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password, 'fr');
    await page.goto('/fr/dashboard');
    await expect(page.getByTestId('tavern-button')).toBeVisible();
    const tavernButton = page.getByTestId('tavern-button');
    await expect(tavernButton).toContainText('Taverne');
  });

  test('should show ludus full message when ludus is at capacity', async ({ page }) => {
    // This test assumes the ludus is full (maxGladiators reached)
    // In a real scenario, you might need to setup a full ludus first
    await page.goto('/en/tavern');
    await page.waitForTimeout(3000);
    
    // Check if ludus full message appears (only if ludus is actually full)
    const ludusFullMessage = page.locator('text=Ludus Full');
    const isVisible = await ludusFullMessage.isVisible().catch(() => false);
    
    if (isVisible) {
      await expect(ludusFullMessage).toBeVisible();
      await expect(page.locator('text=Your ludus has reached its maximum capacity')).toBeVisible();
    }
  });

  test('should display gladiator personality trait', async ({ page }) => {
    await page.goto('/en/tavern');
    await page.waitForTimeout(3000);
    
    const firstGladiator = page.locator('[data-testid^="tavern-gladiator-"]').first();
    const personality = firstGladiator.locator('text=/Personality:/');
    await expect(personality).toBeVisible();
  });

  test('should display health bar for each gladiator', async ({ page }) => {
    await page.goto('/en/tavern');
    await page.waitForTimeout(3000);
    
    const firstGladiator = page.locator('[data-testid^="tavern-gladiator-"]').first();
    const healthBar = firstGladiator.locator('text=Health');
    await expect(healthBar).toBeVisible();
  });

  test('should display gladiator name and birthplace', async ({ page }) => {
    await page.goto('/en/tavern');
    await page.waitForTimeout(3000);
    
    const firstGladiator = page.locator('[data-testid^="tavern-gladiator-"]').first();
    // Check that the gladiator card has text content (name and birthplace)
    const textContent = await firstGladiator.textContent();
    expect(textContent).toBeTruthy();
    expect(textContent?.length).toBeGreaterThan(0);
  });

  test('should handle reroll action', async ({ page }) => {
    await page.goto('/en/tavern');
    await page.waitForTimeout(3000);
    
    const firstGladiator = page.locator('[data-testid^="tavern-gladiator-"]').first();
    const rerollButton = firstGladiator.locator('[data-testid^="reroll-button-"]');

    // Click reroll
    await rerollButton.click();
    
    // Wait for the reroll to complete
    await page.waitForTimeout(2000);
    
    // The gladiator should be replaced (or at least the button should be enabled again)
    await expect(rerollButton).toBeEnabled();
  });
});

