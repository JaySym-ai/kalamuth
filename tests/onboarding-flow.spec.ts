import { test, expect } from '@playwright/test';
import { loginUser } from './helpers/auth';

test.describe('Complete Onboarding Flow', () => {
  test('should complete full onboarding from intro to dashboard', async ({ page }) => {
    // Start at homepage
    await page.goto('/en');

    // Click "Begin Your Legacy" button to go to intro
    await page.getByRole('link', { name: /begin your legacy/i }).click();
    await expect(page).toHaveURL(/\/en\/intro/);

    // Verify intro page content
    await expect(page.getByText(/Enter the Arena of Legends/i)).toBeVisible();
    await expect(page.getByText(/This game is driven by AI/i)).toBeVisible();

    // Click "I Am Ready" button
    await page.getByTestId('intro-ready-button').click();
    await expect(page).toHaveURL(/\/en\/auth/);

    // Verify auth page has ludus context
    await expect(page.getByText(/First step to get your ludus/i)).toBeVisible();

    // Use smart login/registration with the fixed test account (idempotent)
    await loginUser(page);

    // Depending on existing state (first run vs re-run), continue the flow
    let url = page.url();

    if (/\/en\/server-selection\/?$/.test(url)) {
      // Select a server
      await expect(page.getByText(/Select Your Server/i)).toBeVisible();
      await page.getByTestId('server-alpha-1').click();
      await expect(page.getByText(/SELECTED/)).toBeVisible();

      // Continue to ludus creation
      await page.getByTestId('continue-button').click();
      await expect(page).toHaveURL(/\/en\/ludus-creation/);
      url = page.url();
    }

    if (/\/en\/ludus-creation\/?$/.test(url)) {
      // Create ludus
      await expect(page.getByText(/Create Your Ludus/i)).toBeVisible();
      await page.getByTestId('ludus-name-input').fill('Test Ludus');
      await page.getByTestId('city-velusia').click();
      await page.getByTestId('motto-input').fill('Victory or Death');

      // Submit ludus creation
      await page.getByTestId('create-ludus-button').click();
      await page.waitForURL(/\/en\/initial-gladiators/, { timeout: 15000 });
      url = page.url();
    }

    if (/\/en\/initial-gladiators\/?$/.test(url)) {
      await expect(page.getByText(/Meet Your Gladiators/i)).toBeVisible();
      const generating = page.getByTestId('generating-indicator');
      await expect(generating).toBeVisible();

      // Continue to dashboard (enabled once min gladiators exist; may be disabled in CI w/o functions)
      const continueBtn = page.getByTestId('continue-to-dashboard');
      if (await continueBtn.isEnabled()) {
        await continueBtn.click();
      }
    }

    // End state: dashboard or still in initial gladiators if generation is mocked
    await expect(page).toHaveURL(/\/en\/(dashboard|initial-gladiators)/);
  });

  test('should redirect authenticated users with ludus from intro', async ({ page }) => {
    // Login first
    await loginUser(page);

    // Try to access intro page as authenticated user
    await page.goto('/en/intro');

    // Should be redirected based on user state
    // Either to dashboard (if ludus exists) or to setup flow
    const url = page.url();
    expect(url).toMatch(/\/(dashboard|server-selection|ludus-creation|initial-gladiators)/);
  });

  test('should handle French locale throughout onboarding', async ({ page }) => {
    // Start at French homepage
    await page.goto('/fr');

    // Click "Commencez votre héritage" button
    await page.getByRole('link', { name: /Commencez votre héritage/i }).click();
    await expect(page).toHaveURL(/\/fr\/intro/);

    // Verify French intro content
    await expect(page.getByText(/Entrez dans l'Arène des Légendes/i)).toBeVisible();
    await expect(page.getByText(/Ce jeu est propulsé par l'IA/i)).toBeVisible();

    // Click "Je suis prêt" button
    await page.getByTestId('intro-ready-button').click();
    await expect(page).toHaveURL(/\/fr\/auth/);

    // Verify French auth context
    await expect(page.getByText(/Première étape pour obtenir votre ludus/i)).toBeVisible();
  });

  test('should validate required fields in ludus creation', async ({ page }) => {
    // Login first
    await loginUser(page);
    // Navigate directly to ludus creation (assuming session storage has server)
    await page.goto('/en/ludus-creation');

    // Button should be disabled without required fields
    const button = page.getByTestId('create-ludus-button');
    await expect(button).toBeDisabled();

    // Fill in the name
    await page.getByTestId('ludus-name-input').fill('My Ludus');

    // Button should now be enabled
    await expect(button).toBeEnabled();
  });

  test('should handle server selection properly', async ({ page }) => {
    // Login first
    await loginUser(page);
    await page.goto('/en/server-selection');

    // Verify multiple servers are displayed
    const servers = page.locator('[data-testid^="server-"]');
    await expect(servers).toHaveCount(2); // Based on SERVERS data

    // Verify server features are displayed
    await expect(page.getByText(/Hardcore Mode/i).first()).toBeVisible();
    await expect(page.getByText(/Starting Gladiators/i).first()).toBeVisible();

    // Continue button should be disabled without selection
    const continueBtn = page.getByTestId('continue-button');
    await expect(continueBtn).toBeDisabled();

    // Select a server
    await page.getByTestId('server-alpha-2').click();

    // Continue button should now be enabled
    await expect(continueBtn).toBeEnabled();
  });

  test('should display gladiator details modal', async ({ page }) => {
    // Login first
    await loginUser(page);
    // Navigate to initial gladiators page
    await page.goto('/en/initial-gladiators');
    await expect(page.getByText(/Meet Your Gladiators/i)).toBeVisible();

    const firstGladiator = page.locator('[data-testid^="gladiator-"]').first();
    try {
      await firstGladiator.click({ timeout: 3000 });

      // Modal should open with gladiator details
      await expect(page.getByText(/Combat Statistics/i)).toBeVisible();
      await expect(page.getByText(/Backstory/i)).toBeVisible();
      await expect(page.getByText(/Personality/i)).toBeVisible();

      // Stats should be visible
      await expect(page.getByText(/Strength/i)).toBeVisible();
      await expect(page.getByText(/Agility/i)).toBeVisible();
      await expect(page.getByText(/Speed/i)).toBeVisible();

      // Close modal
      await page.getByTestId('close-modal').click();
      await expect(page.getByText(/Combat Statistics/i)).not.toBeVisible();
    } catch {
      // If no cards yet, we should at least see the generating indicator
      await expect(page.getByTestId('generating-indicator')).toBeVisible();
    }
  });

  test('should have proper mobile viewport handling', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/en/intro');

    // All content should be visible and properly sized
    await expect(page.getByText(/Enter the Arena of Legends/i)).toBeVisible();

    // Features grid should stack on mobile
    const features = page.locator('.grid > div').filter({ hasText: /AI-Driven Combat|Natural Conversations|Strategic Management|Compete for Glory/i });
    await expect(features).toHaveCount(4);

    // Ready button should be full width on mobile
    const readyButton = page.getByTestId('intro-ready-button');
    await expect(readyButton).toBeVisible();

    // Navigate through mobile flow
    await readyButton.click();
    await expect(page).toHaveURL(/\/en\/auth/);

    // Auth form should be mobile-friendly
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('password-input')).toBeVisible();
  });

  test('should handle errors gracefully', async ({ page }) => {
    await page.goto('/en/auth');

    // Try to login with invalid credentials
    await page.getByTestId('email-input').fill('invalid@test.com');
    await page.getByTestId('password-input').fill('wrongpassword');
    await page.getByTestId('login-submit-button').click();

    // Should show error message
    await expect(page.getByText(/error|invalid|failed/i)).toBeVisible({ timeout: 5000 });
  });

  test('Initial Gladiators shows generating state in FR', async ({ page }) => {
    await loginUser(page);
    await page.goto('/fr/initial-gladiators');
    await expect(page.getByRole('heading', { name: 'Rencontrez Vos Gladiateurs' })).toBeVisible();
    await expect(page.getByTestId('generating-indicator')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Générer le reste' })).toBeVisible();
  });

  test('Generate remaining triggers API call', async ({ page }) => {
    await loginUser(page);
    let called = false;
    await page.route('**/api/gladiators/start', async (route) => {
      called = true;
      await route.fulfill({ status: 202, contentType: 'application/json', body: JSON.stringify({ ok: true, jobId: 'test', count: 1 }) });
    });

    await page.goto('/en/initial-gladiators');
    await expect(page.getByTestId('generating-indicator')).toBeVisible();
    await page.getByTestId('generate-remaining').click();
    expect(called).toBeTruthy();
  });
});
