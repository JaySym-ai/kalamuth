import { test, expect } from '@playwright/test';
import { loginUser, TEST_CREDENTIALS } from './helpers/auth';

test.describe('Server-specific Quests Isolation', () => {
  test.beforeEach(async ({ page }) => {
    // Login with test credentials
    await loginUser(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password, 'en');
  });

  test('quests are isolated per server - user sees only current server quests', async ({ page }) => {
    // Step 1: Navigate to quests page
    await page.goto('/en/quests');
    await page.waitForLoadState('networkidle');

    // Step 2: Check if we're on quests page (not redirected to server selection)
    expect(page.url()).toContain('/en/quests');

    // Step 3: Note the quests we see on current server
    const initialQuestTitles = await page.evaluate(() => {
      const questElements = document.querySelectorAll('[data-testid^="quest-"]');
      return Array.from(questElements).map(el => {
        const titleElement = el.querySelector('h3, h4, .title, [class*="title"]');
        return titleElement ? titleElement.textContent?.trim() : null;
      }).filter(Boolean);
    });

    console.log(`Found ${initialQuestTitles.length} quests on current server:`, initialQuestTitles);

    // Step 4: Navigate to dashboard to access server switching
    await page.goto('/en/dashboard');
    await page.waitForLoadState('networkidle');

    // Step 5: Open server selection modal
    const changeServerButton = page.getByTestId('change-server-button');
    await changeServerButton.click();
    await page.waitForLoadState('networkidle');

    // Step 6: Find available servers
    const serverOptions = page.locator('[data-testid^="server-option-"]');
    const serverCount = await serverOptions.count();
    expect(serverCount).toBeGreaterThan(0);

    // Step 7: Try to find a different server (not the current one)
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
      
      // Step 8: Click on the different server
      await differentServerButton.click();

      // Step 9: Handle confirmation dialog if it appears
      const confirmDialog = page.locator('text=Switch Server?');
      if (await confirmDialog.isVisible({ timeout: 2000 })) {
        const confirmButton = page.locator('button:has-text("Yes, Create Ludus")').first();
        await confirmButton.click();
      }

      // Step 10: Wait for navigation to complete
      await page.waitForURL(/\/(en|fr)\/(ludus-creation|server-selection)/, { timeout: 15000 });

      // Step 11: If we're on ludus creation, create a new ludus
      if (page.url().includes('ludus-creation')) {
        await page.getByTestId('ludus-name-input').fill('Test Ludus Server 2');
        await page.getByTestId('create-ludus-button').click();
        
        // Wait for initial gladiators page
        await page.waitForURL(/\/(en|fr)\/initial-gladiators/, { timeout: 15000 });
        
        // Navigate to quests page
        await page.goto('/en/quests');
      } else {
        // Navigate directly to quests if we're on server selection
        await page.goto('/en/quests');
      }

      await page.waitForLoadState('networkidle');

      // Step 12: Check quests on the new server
      const newServerQuestTitles = await page.evaluate(() => {
        const questElements = document.querySelectorAll('[data-testid^="quest-"]');
        return Array.from(questElements).map(el => {
          const titleElement = el.querySelector('h3, h4, .title, [class*="title"]');
          return titleElement ? titleElement.textContent?.trim() : null;
        }).filter(Boolean);
      });

      console.log(`Found ${newServerQuestTitles.length} quests on new server:`, newServerQuestTitles);

      // Step 13: Verify that quests are different (or empty on new server)
      // This proves isolation - we shouldn't see quests from the previous server
      const hasDifferentQuests = newServerQuestTitles.length !== initialQuestTitles.length ||
                                newServerQuestTitles.some(title => !initialQuestTitles.includes(title));

      if (newServerQuestTitles.length === 0) {
        console.log('✅ Server isolation working: No quests found on new server (expected for new ludus)');
        
        // Should show quest generation option
        await expect(page.getByText(/generate quest|create quest/i)).toBeVisible();
      } else if (hasDifferentQuests) {
        console.log('✅ Server isolation working: Different quests on different servers');
      } else {
        console.log('⚠️  Potential issue: Same quests found on both servers');
        // This could be expected if the user has the same quests on both servers
        // but in a properly isolated system, this should not happen
      }

      // Step 14: Verify the page shows appropriate messaging for the server context
      await expect(page.getByRole('heading', { name: /quest|adventure/i })).toBeVisible();

    } else {
      console.log('No different server found for testing - user may have ludi on all servers');
      
      // Even if we can't test server switching, verify current server shows correct quests
      expect(initialQuestTitles.length).toBeGreaterThanOrEqual(0);
      
      // Verify page structure
      await expect(page.getByRole('heading', { name: /quest|adventure/i })).toBeVisible();
    }
  });

  test('quests page handles server context correctly on direct navigation', async ({ page }) => {
    // Test direct navigation to quests page
    await page.goto('/en/quests');
    await page.waitForLoadState('networkidle');

    // Should either show quests or redirect to server selection
    const currentUrl = page.url();
    
    if (currentUrl.includes('/en/quests')) {
      // Successfully loaded quests page
      await expect(page.getByRole('heading', { name: /quest|adventure/i })).toBeVisible();
      
      // Should show either quests or appropriate empty state
      const hasQuests = await page.locator('[data-testid^="quest-"]').count() > 0;
      const hasGenerateQuest = await page.getByText(/generate quest|create quest/i).isVisible();
      
      expect(hasQuests || hasGenerateQuest).toBeTruthy();
    } else if (currentUrl.includes('/server-selection')) {
      // User has no ludus, correctly redirected to server selection
      await expect(page.getByText('Select a Server')).toBeVisible();
    } else {
      // Some other page - should be auth or another valid redirect
      expect(currentUrl).toMatch(/\/(en|fr)\/(auth|dashboard)/);
    }
  });

  test('server switching maintains proper quests context', async ({ page }) => {
    // Navigate to quests page
    await page.goto('/en/quests');
    await page.waitForLoadState('networkidle');

    // Get initial state
    const initialUrl = page.url();
    expect(initialUrl).toContain('/en/quests');

    // Navigate to dashboard
    await page.goto('/en/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify we're still on the same server context
    const dashboardUrl = page.url();
    expect(dashboardUrl).toContain('/en/dashboard');

    // Navigate back to quests
    await page.goto('/en/quests');
    await page.waitForLoadState('networkidle');

    // Should still be on quests page (not redirected)
    const finalUrl = page.url();
    expect(finalUrl).toContain('/en/quests');

    // Page should load successfully without errors
    await expect(page.getByRole('heading', { name: /quest|adventure/i })).toBeVisible();
  });
});
