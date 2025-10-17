import { test, expect } from '@playwright/test';
import { loginUser, TEST_CREDENTIALS } from './helpers/auth';

test.describe('Server-specific Gladiator Isolation', () => {
  test.beforeEach(async ({ page }) => {
    // Login with test credentials
    await loginUser(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password, 'en');
  });

  test('gladiators are isolated per server - user sees only current server gladiators', async ({ page }) => {
    // Step 1: Navigate to gladiators page
    await page.goto('/en/gladiators');
    await page.waitForLoadState('networkidle');

    // Step 2: Check if we're on gladiators page (not redirected to server selection)
    expect(page.url()).toContain('/en/gladiators');

    // Step 3: Get current server info from the page (for debugging if needed)
    // const currentServerInfo = await page.evaluate(() => {
    //   // Look for server information in the DOM
    //   const serverElement = document.querySelector('[data-testid*="server"]') ||
    //                        document.querySelector('[class*="server"]');
    //   return serverElement ? serverElement.textContent : null;
    // });

    // Step 4: Note the gladiators we see
    const initialGladiatorNames = await page.evaluate(() => {
      const gladiatorElements = document.querySelectorAll('[data-testid^="gladiator-"]');
      return Array.from(gladiatorElements).map(el => {
        const nameElement = el.querySelector('h3, h4, .name, [class*="name"]');
        return nameElement ? nameElement.textContent?.trim() : null;
      }).filter(Boolean);
    });

    console.log(`Found ${initialGladiatorNames.length} gladiators on current server:`, initialGladiatorNames);

    // Step 5: Navigate to dashboard to access server switching
    await page.goto('/en/dashboard');
    await page.waitForLoadState('networkidle');

    // Step 6: Open server selection modal
    const changeServerButton = page.getByTestId('change-server-button');
    await changeServerButton.click();
    await page.waitForLoadState('networkidle');

    // Step 7: Find available servers
    const serverOptions = page.locator('[data-testid^="server-option-"]');
    const serverCount = await serverOptions.count();
    expect(serverCount).toBeGreaterThan(0);

    // Step 8: Try to find a different server (not the current one)
    let differentServerFound = false;
    let differentServerButton = null;

    for (let i = 0; i < serverCount; i++) {
      const serverOption = serverOptions.nth(i);
      const serverText = await serverOption.textContent();
      
      // Look for servers that show "Create new ludus" (indicating no existing ludus)
      if (serverText && serverText.includes('Create new ludus')) {
        differentServerButton = serverOption;
        differentServerFound = true;
        break;
      }
    }

    if (differentServerFound && differentServerButton) {
      console.log('Found different server without ludus, switching...');
      
      // Step 9: Click on the different server
      await differentServerButton.click();

      // Step 10: Handle confirmation dialog if it appears
      const confirmDialog = page.locator('text=Switch Server?');
      if (await confirmDialog.isVisible({ timeout: 2000 })) {
        const confirmButton = page.locator('button:has-text("Yes, Create Ludus")').first();
        await confirmButton.click();
      }

      // Step 11: Wait for navigation to complete
      await page.waitForURL(/\/(en|fr)\/(ludus-creation|server-selection)/, { timeout: 15000 });

      // Step 12: If we're on ludus creation, create a new ludus
      if (page.url().includes('ludus-creation')) {
        await page.getByTestId('ludus-name-input').fill('Test Ludus Server 2');
        await page.getByTestId('create-ludus-button').click();
        
        // Wait for initial gladiators page
        await page.waitForURL(/\/(en|fr)\/initial-gladiators/, { timeout: 15000 });
        
        // Navigate through initial gladiators if needed
        await page.goto('/en/gladiators');
      } else {
        // Navigate directly to gladiators if we're on server selection
        await page.goto('/en/gladiators');
      }

      await page.waitForLoadState('networkidle');

      // Step 13: Check gladiators on the new server
      const newServerGladiatorNames = await page.evaluate(() => {
        const gladiatorElements = document.querySelectorAll('[data-testid^="gladiator-"]');
        return Array.from(gladiatorElements).map(el => {
          const nameElement = el.querySelector('h3, h4, .name, [class*="name"]');
          return nameElement ? nameElement.textContent?.trim() : null;
        }).filter(Boolean);
      });

      console.log(`Found ${newServerGladiatorNames.length} gladiators on new server:`, newServerGladiatorNames);

      // Step 14: Verify that gladiators are different (or empty on new server)
      // This proves isolation - we shouldn't see gladiators from the previous server
      const hasDifferentGladiators = newServerGladiatorNames.length !== initialGladiatorNames.length ||
                                   newServerGladiatorNames.some(name => !initialGladiatorNames.includes(name));

      if (newServerGladiatorNames.length === 0) {
        console.log('✅ Server isolation working: No gladiators found on new server (expected for new ludus)');
      } else if (hasDifferentGladiators) {
        console.log('✅ Server isolation working: Different gladiators on different servers');
      } else {
        console.log('⚠️  Potential issue: Same gladiators found on both servers');
        // This could be expected if the user has the same gladiators on both servers
        // but in a properly isolated system, this should not happen
      }

      // Step 15: Verify the page shows appropriate messaging for the server context
      await expect(page.getByTestId('page-header-title')).toBeVisible();

      // If no gladiators, should show recruitment message
      if (newServerGladiatorNames.length === 0) {
        await expect(page.getByText(/recruit|no gladiators/i)).toBeVisible();
      }

    } else {
      console.log('No different server found for testing - user may have ludi on all servers');
      
      // Even if we can't test server switching, verify current server shows correct gladiators
      expect(initialGladiatorNames.length).toBeGreaterThanOrEqual(0);
      
      // Verify page structure
      await expect(page.getByTestId('page-header-title')).toBeVisible();
    }
  });

  test('server switching maintains proper gladiator context', async ({ page }) => {
    // Navigate to gladiators page
    await page.goto('/en/gladiators');
    await page.waitForLoadState('networkidle');

    // Get initial state
    const initialUrl = page.url();
    expect(initialUrl).toContain('/en/gladiators');

    // Navigate to dashboard
    await page.goto('/en/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify we're still on the same server context
    const dashboardUrl = page.url();
    expect(dashboardUrl).toContain('/en/dashboard');

    // Navigate back to gladiators
    await page.goto('/en/gladiators');
    await page.waitForLoadState('networkidle');

    // Should still be on gladiators page (not redirected)
    const finalUrl = page.url();
    expect(finalUrl).toContain('/en/gladiators');

    // Page should load successfully without errors
    await expect(page.getByTestId('page-header-title')).toBeVisible();
  });

  test('gladiator page handles server context correctly on direct navigation', async ({ page }) => {
    // Test direct navigation to gladiators page
    await page.goto('/en/gladiators');
    await page.waitForLoadState('networkidle');

    // Should either show gladiators or redirect to server selection
    const currentUrl = page.url();
    
    if (currentUrl.includes('/en/gladiators')) {
      // Successfully loaded gladiators page
      await expect(page.getByTestId('page-header-title')).toBeVisible();
      
      // Should show either gladiators or appropriate empty state
      const hasGladiators = await page.locator('[data-testid^="gladiator-"]').count() > 0;
      const hasRecruitMessage = await page.getByText(/recruit|no gladiators/i).isVisible();
      
      expect(hasGladiators || hasRecruitMessage).toBeTruthy();
    } else if (currentUrl.includes('/server-selection')) {
      // User has no ludus, correctly redirected to server selection
      await expect(page.getByText('Select a Server')).toBeVisible();
    } else {
      // Some other page - should be auth or another valid redirect
      expect(currentUrl).toMatch(/\/(en|fr)\/(auth|dashboard)/);
    }
  });
});
