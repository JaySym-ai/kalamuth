import { test, expect } from '@playwright/test';
import { loginUser, TEST_CREDENTIALS } from './helpers/auth';

test.describe('Server Switch Complete Flow', () => {
  test('should switch to new server and trigger onboarding when no ludus exists', async ({ page }) => {
    // 1. Login with test account
    await loginUser(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password, 'en');
    await page.goto('/en/dashboard');
    await page.waitForLoadState('networkidle');

    // 2. Open change server modal
    const changeServerButton = page.getByTestId('change-server-button');
    await changeServerButton.click();
    await page.waitForLoadState('networkidle');

    // 3. Find a server without ludus
    const serverOptions = page.locator('[data-testid^="server-option-"]');
    const count = await serverOptions.count();
    console.log(`Found ${count} server options`);

    let selectedServerName = '';
    for (let i = 0; i < count; i++) {
      const option = serverOptions.nth(i);
      const statusText = await option.locator('text=/Has Ludus|No Ludus/').textContent();
      console.log(`Server ${i}: ${statusText}`);
      
      if (statusText?.includes('No Ludus')) {
        selectedServerName = await option.locator('h3').textContent() || '';
        console.log(`Selecting server without ludus: ${selectedServerName}`);
        await option.click();
        break;
      }
    }

    // 4. Confirm server switch
    await expect(page.locator('text=/Switch Server|Confirmation/i')).toBeVisible({ timeout: 5000 });
    const confirmButton = page.locator('button:has-text(/Yes|Confirm|Create/i)').first();
    await confirmButton.click();

    // 5. Should redirect to ludus-creation or server-selection
    await page.waitForURL(/\/(en|fr)\/(ludus-creation|server-selection)/, { timeout: 10000 });
    const currentUrl = page.url();
    console.log(`Redirected to: ${currentUrl}`);

    // 6. If on ludus-creation, complete the ludus creation
    if (currentUrl.includes('ludus-creation')) {
      // Fill in ludus name
      const ludusNameInput = page.locator('input[placeholder*="ludus" i], input[placeholder*="name" i]').first();
      if (await ludusNameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await ludusNameInput.fill('Test Ludus ' + Date.now());
      }

      // Click establish ludus button
      const establishButton = page.locator('button:has-text(/Establish|Create|Confirm/i)').first();
      await establishButton.click();

      // Wait for redirect to initial-gladiators
      await page.waitForURL(/\/(en|fr)\/initial-gladiators/, { timeout: 15000 });
    }

    // 7. Verify we're on initial-gladiators page
    await expect(page).toHaveURL(/\/(en|fr)\/initial-gladiators/);
    console.log('Successfully reached initial-gladiators page');

    // 8. Navigate to dashboard
    await page.goto('/en/dashboard');
    await page.waitForLoadState('networkidle');

    // 9. Verify the server is now set as preferred
    // Check that we're still on dashboard (not redirected to server selection)
    await expect(page).toHaveURL(/\/en\/dashboard/);
    console.log('Dashboard loaded - server appears to be set as preferred');

    // 10. Open change server modal again to verify the new server shows ludus
    await changeServerButton.click();
    await page.waitForLoadState('networkidle');

    // Find the server we just created ludus on
    const updatedServerOptions = page.locator('[data-testid^="server-option-"]');
    let foundWithLudus = false;
    const updatedCount = await updatedServerOptions.count();
    
    for (let i = 0; i < updatedCount; i++) {
      const option = updatedServerOptions.nth(i);
      const serverNameText = await option.locator('h3').textContent();
      const statusText = await option.locator('text=/Has Ludus|No Ludus/').textContent();
      
      if (serverNameText?.includes(selectedServerName) && statusText?.includes('Has Ludus')) {
        foundWithLudus = true;
        console.log(`✓ Server ${selectedServerName} now shows "Has Ludus"`);
        break;
      }
    }

    expect(foundWithLudus).toBe(true);
  });

  test('should set new server as preferred after ludus creation', async ({ page }) => {
    // Login
    await loginUser(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password, 'en');
    await page.goto('/en/dashboard');
    await page.waitForLoadState('networkidle');

    // Get current ludus info
    const currentLudusName = await page.locator('[data-testid="ludus-name"]').textContent();
    console.log(`Current ludus: ${currentLudusName}`);

    // Open change server modal
    const changeServerButton = page.getByTestId('change-server-button');
    await changeServerButton.click();
    await page.waitForLoadState('networkidle');

    // Select a server without ludus
    const serverOptions = page.locator('[data-testid^="server-option-"]');
    const count = await serverOptions.count();

    for (let i = 0; i < count; i++) {
      const option = serverOptions.nth(i);
      const statusText = await option.locator('text=/Has Ludus|No Ludus/').textContent();

      if (statusText?.includes('No Ludus')) {
        await option.click();
        break;
      }
    }

    // Confirm and complete ludus creation
    await expect(page.locator('text=/Switch Server|Confirmation/i')).toBeVisible({ timeout: 5000 });
    const confirmButton = page.locator('button:has-text(/Yes|Confirm|Create/i)').first();
    await confirmButton.click();

    await page.waitForURL(/\/(en|fr)\/(ludus-creation|server-selection)/, { timeout: 10000 });

    if (page.url().includes('ludus-creation')) {
      const ludusNameInput = page.locator('input[placeholder*="ludus" i], input[placeholder*="name" i]').first();
      if (await ludusNameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await ludusNameInput.fill('Preferred Server Ludus ' + Date.now());
      }

      const establishButton = page.locator('button:has-text(/Establish|Create|Confirm/i)').first();
      await establishButton.click();

      await page.waitForURL(/\/(en|fr)\/initial-gladiators/, { timeout: 15000 });
    }

    // Navigate back to dashboard
    await page.goto('/en/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify we're on dashboard (not redirected to server selection)
    await expect(page).toHaveURL(/\/en\/dashboard/);

    // Verify the ludus name changed (indicating we're on the new server)
    const newLudusName = await page.locator('[data-testid="ludus-name"]').textContent();
    console.log(`New ludus: ${newLudusName}`);
    
    // The ludus name should be different from the original
    expect(newLudusName).not.toBe(currentLudusName);
    console.log('✓ Successfully switched to new server and it is set as preferred');
  });
});

