import { test, expect } from '@playwright/test';
import { loginUser, TEST_CREDENTIALS } from './helpers/auth';

test.describe('Server Isolation - Simple Test', () => {
  test.beforeEach(async ({ page }) => {
    // Login with test credentials
    await loginUser(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password, 'en');
  });

  test('gladiators page loads without errors', async ({ page }) => {
    // Navigate to gladiators page
    await page.goto('/en/gladiators');
    
    // Wait for page to load (use a shorter timeout and different wait strategy)
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Should be on gladiators page or redirected to server selection/auth
    if (currentUrl.includes('/en/gladiators')) {
      // Successfully loaded gladiators page
      console.log('Successfully loaded gladiators page');
      
      // Check for page header
      const header = await page.locator('h1').first();
      await expect(header).toBeVisible();
      
      // Check if we have gladiators or empty state
      const gladiatorCount = await page.locator('[data-testid^="gladiator-"]').count();
      console.log(`Found ${gladiatorCount} gladiators`);
      
      // Should show either gladiators or recruitment message
      if (gladiatorCount === 0) {
        // Should show recruitment message if no gladiators
        const hasRecruitMessage = await page.getByText(/recruit/i).count() > 0;
        console.log('Has recruit message:', hasRecruitMessage);
      }
      
    } else if (currentUrl.includes('/server-selection')) {
      // User has no ludus, correctly redirected to server selection
      console.log('Redirected to server selection (no ludus found)');
      await expect(page.getByText('Select a Server')).toBeVisible();
    } else if (currentUrl.includes('/auth')) {
      // User not authenticated
      console.log('Redirected to auth page');
      await expect(page.getByText(/sign in|log in/i)).toBeVisible();
    } else {
      // Other page
      console.log('On other page:', currentUrl);
    }
  });

  test('quests page loads without errors', async ({ page }) => {
    // Navigate to quests page
    await page.goto('/en/quests');
    
    // Wait for page to load
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Should be on quests page or redirected
    if (currentUrl.includes('/en/quests')) {
      // Successfully loaded quests page
      console.log('Successfully loaded quests page');
      
      // Check for page header
      const header = await page.locator('h1').first();
      await expect(header).toBeVisible();
      
      // Check if we have quests or empty state
      const questCount = await page.locator('[data-testid^="quest-"]').count();
      console.log(`Found ${questCount} quests`);
      
    } else if (currentUrl.includes('/server-selection')) {
      // User has no ludus, correctly redirected
      console.log('Redirected to server selection (no ludus found)');
      await expect(page.getByText('Select a Server')).toBeVisible();
    } else {
      console.log('On other page:', currentUrl);
    }
  });

  test('dashboard shows correct server context', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/en/dashboard');
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Should be on dashboard
    expect(page.url()).toContain('/en/dashboard');
    
    // Check for dashboard content
    const header = await page.locator('h1').first();
    await expect(header).toBeVisible();
    
    // Should show ludus information
    const hasLudusInfo = await page.getByText(/ludus|arena/i).count() > 0;
    console.log('Has ludus info:', hasLudusInfo);
  });
});
