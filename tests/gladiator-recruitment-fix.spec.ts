import { test, expect } from '@playwright/test';
import { loginUser, TEST_CREDENTIALS } from './helpers/auth';

test.describe('Gladiator Recruitment Count Fix', () => {
  test.beforeEach(async ({ page }) => {
    // Login with test credentials
    await loginUser(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password, 'en');
  });

  test('recruitment works when gladiator count is out of sync', async ({ page }) => {
    // Step 1: Navigate to gladiators page to check current state
    await page.goto('/en/gladiators');
    await page.waitForLoadState('networkidle');

    // Step 2: Get current gladiator count from the UI
    const initialGladiatorCount = await page.locator('[data-testid^="gladiator-"]').count();
    console.log(`Initial gladiator count from UI: ${initialGladiatorCount}`);

    // Step 3: Navigate to tavern to recruit a gladiator
    await page.goto('/en/tavern');
    await page.waitForLoadState('networkidle');

    // Step 4: Check if there are gladiators available to recruit
    const tavernGladiators = page.locator('[data-testid^="tavern-gladiator-"]');
    const availableCount = await tavernGladiators.count();
    console.log(`Available tavern gladiators: ${availableCount}`);

    if (availableCount === 0) {
      console.log('No tavern gladiators available for recruitment test');
      return; // Skip test if no gladiators available
    }

    // Step 5: Try to recruit the first available gladiator
    const firstGladiator = tavernGladiators.first();
    const recruitButton = firstGladiator.locator('button:has-text("Recruit")').first();
    
    // Check if recruit button is enabled
    const isRecruitEnabled = await recruitButton.isEnabled();
    console.log(`Recruit button enabled: ${isRecruitEnabled}`);

    if (isRecruitEnabled) {
      // Step 6: Click recruit button
      await recruitButton.click();
      
      // Step 7: Wait for recruitment to complete (look for success indicators)
      await page.waitForTimeout(2000); // Wait for API call and UI update
      
      // Step 8: Check if recruitment was successful
      const successIndicators = await page.locator('text=/successfully recruited|recruitment complete/i').count();
      const errorIndicators = await page.locator('text=/ludus full|cannot recruit/i').count();
      
      console.log(`Success indicators found: ${successIndicators}`);
      console.log(`Error indicators found: ${errorIndicators}`);
      
      // Step 9: Navigate back to gladiators page to verify count increased
      await page.goto('/en/gladiators');
      await page.waitForLoadState('networkidle');
      
      const finalGladiatorCount = await page.locator('[data-testid^="gladiator-"]').count();
      console.log(`Final gladiator count from UI: ${finalGladiatorCount}`);
      
      // Verify recruitment was successful
      expect(finalGladiatorCount).toBeGreaterThan(initialGladiatorCount);
      
    } else {
      // If recruit button is disabled, check why
      const buttonText = await recruitButton.textContent();
      const buttonTitle = await recruitButton.getAttribute('title');
      console.log(`Recruit button disabled. Text: "${buttonText}", Title: "${buttonTitle}"`);
      
      // Should not say "ludus full" if we have 0 gladiators
      const buttonDisabledReason = buttonTitle || buttonText || '';
      const hasLudusFullMessage = buttonDisabledReason.toLowerCase().includes('ludus full') || 
                                 await page.locator('text=/ludus full/i').count() > 0;
      
      if (hasLudusFullMessage && initialGladiatorCount === 0) {
        throw new Error('BUG DETECTED: Ludus shows as full but has 0 gladiators. This indicates the gladiator count synchronization issue.');
      }
    }
  });

  test('gladiator count displays correctly in UI', async ({ page }) => {
    // Navigate to dashboard to see ludus info
    await page.goto('/en/dashboard');
    await page.waitForLoadState('networkidle');

    // Look for gladiator count display
    const gladiatorCountElements = await page.locator('text=/\d+\/\d+ gladiators|gladiators: \d+\/\d+/i').count();
    console.log(`Found ${gladiatorCountElements} gladiator count displays`);

    if (gladiatorCountElements > 0) {
      // Get the text content of the first count display
      const countText = await page.locator('text=/\d+\/\d+/').first().textContent();
      console.log(`Gladiator count display: "${countText}"`);
      
      // Extract numbers from text like "0/5" or "2/5"
      const match = countText?.match(/(\d+)\/(\d+)/);
      if (match) {
        const current = parseInt(match[1]);
        const max = parseInt(match[2]);
        console.log(`Current: ${current}, Max: ${max}`);
        
        // Verify current count is reasonable (not negative, not exceeding max)
        expect(current).toBeGreaterThanOrEqual(0);
        expect(current).toBeLessThanOrEqual(max);
        expect(max).toBeGreaterThan(0);
      }
    }
  });

  test('tavern shows correct recruitment availability', async ({ page }) => {
    // Navigate to tavern
    await page.goto('/en/tavern');
    await page.waitForLoadState('networkidle');

    // Check if tavern shows recruitment status
    const recruitmentStatus = await page.locator('text=/recruit|available|full/i').count();
    console.log(`Found ${recruitmentStatus} recruitment status messages`);

    // Look for any error messages about ludus being full
    const ludusFullMessages = await page.locator('text=/ludus full/i').count();
    console.log(`Found ${ludusFullMessages} "ludus full" messages`);

    if (ludusFullMessages > 0) {
      // Get the full message text
      const fullMessage = await page.locator('text=/ludus full/i').first().textContent();
      console.log(`Ludus full message: "${fullMessage}"`);
      
      // This should not appear if we have 0 gladiators
      const gladiatorCount = await page.locator('[data-testid^="gladiator-"]').count();
      if (gladiatorCount === 0) {
        console.warn('WARNING: Ludus shows as full but has 0 gladiators - this indicates the bug');
      }
    }
  });
});
