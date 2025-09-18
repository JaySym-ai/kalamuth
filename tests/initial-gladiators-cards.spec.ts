import { test, expect } from '@playwright/test';

test.describe('Initial Gladiators Cards', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to intro page first
    await page.goto('/fr/intro');

    // Click "I am ready" button
    await page.getByTestId('ready-button').click();

    // Wait for auth page
    await page.waitForURL('**/auth');

    // Fill in test credentials
    await page.getByTestId('email-input').fill('testplay@kalamuth.com');
    await page.getByTestId('password-input').fill('testpassword123');

    // Click register/login button
    await page.getByTestId('auth-submit').click();

    // Wait for navigation to server selection or initial gladiators
    await page.waitForURL(/\/(server-selection|initial-gladiators)/, { timeout: 15000 });

    // If we're on server selection, select a server and create ludus
    if (page.url().includes('server-selection')) {
      // Select first server
      await page.locator('[data-testid^="server-"]').first().click();

      // Wait for ludus creation page
      await page.waitForURL('**/ludus-creation');

      // Fill ludus name
      await page.getByTestId('ludus-name-input').fill('Test Ludus');

      // Submit ludus creation
      await page.getByTestId('create-ludus-button').click();

      // Wait for initial gladiators page
      await page.waitForURL('**/initial-gladiators', { timeout: 15000 });
    }
  });

  test('displays gladiator cards with compact view', async ({ page }) => {
    // Wait for gladiator cards to be visible
    await page.waitForSelector('[data-testid^="gladiator-"]', { timeout: 10000 });
    
    // Check that at least one gladiator card is displayed
    const gladiatorCards = page.locator('[data-testid^="gladiator-"]');
    await expect(gladiatorCards.first()).toBeVisible();
    
    // Verify compact card shows essential information
    const firstCard = gladiatorCards.first();
    
    // Check for gladiator name
    await expect(firstCard.locator('h3')).toBeVisible();
    
    // Check for birth city
    await expect(firstCard.locator('text=/De/')).toBeVisible();
    
    // Check for health bar
    await expect(firstCard.locator('text=/Santé/')).toBeVisible();
    
    // Check for at least 2 stat previews (Strength and Speed)
    await expect(firstCard.locator('text=/Force/')).toBeVisible();
    await expect(firstCard.locator('text=/Vitesse/')).toBeVisible();
    
    // Check for personality preview
    await expect(firstCard.locator('p.italic')).toBeVisible();
  });

  test('shows status indicators when gladiator has conditions', async ({ page }) => {
    // Wait for gladiator cards
    await page.waitForSelector('[data-testid^="gladiator-"]', { timeout: 10000 });
    
    // Look for any status indicators (injury, sickness, power, handicap)
    const statusIndicators = page.locator('span').filter({ 
      hasText: /🩹|🤒|⚡|♿/ 
    });
    
    // If any gladiator has conditions, they should be visible
    const count = await statusIndicators.count();
    if (count > 0) {
      await expect(statusIndicators.first()).toBeVisible();
    }
  });

  test('opens detailed modal when clicking on gladiator card', async ({ page }) => {
    // Wait for gladiator cards
    await page.waitForSelector('[data-testid^="gladiator-"]', { timeout: 10000 });
    
    // Click on the first gladiator card
    await page.locator('[data-testid^="gladiator-"]').first().click();
    
    // Wait for modal to appear
    await expect(page.locator('[data-testid="close-modal"]')).toBeVisible();
    
    // Check modal header shows gladiator info
    const modal = page.locator('.fixed.inset-0');
    await expect(modal.locator('h2')).toBeVisible();
    await expect(modal.locator('text=/De/')).toBeVisible();
    
    // Check for all stat sections in modal
    await expect(modal.locator('text="Statistiques de Combat"')).toBeVisible();
    
    // Check for detailed stats
    await expect(modal.locator('text=/Force/')).toBeVisible();
    await expect(modal.locator('text=/Agilité/')).toBeVisible();
    await expect(modal.locator('text=/Dextérité/')).toBeVisible();
    await expect(modal.locator('text=/Vitesse/')).toBeVisible();
    await expect(modal.locator('text=/Chance/')).toBeVisible();
    await expect(modal.locator('text=/Intelligence/')).toBeVisible();
    await expect(modal.locator('text=/Charisme/')).toBeVisible();
    await expect(modal.locator('text=/Loyauté/')).toBeVisible();
    
    // Check for character details sections
    await expect(modal.locator('text="Caractère et Personnalité"')).toBeVisible();
    await expect(modal.locator('text=/Histoire/')).toBeVisible();
    await expect(modal.locator('text=/Personnalité/')).toBeVisible();
    await expect(modal.locator('text=/Objectif de Vie/')).toBeVisible();
    
    // Check for preferences section
    await expect(modal.locator('text="Préférences et Traits"')).toBeVisible();
    await expect(modal.locator('text=/Aime/')).toBeVisible();
    await expect(modal.locator('text=/N\'aime pas/')).toBeVisible();
    await expect(modal.locator('text=/Faiblesse/')).toBeVisible();
    await expect(modal.locator('text=/Plus Grande Peur/')).toBeVisible();
  });

  test('closes modal when clicking close button', async ({ page }) => {
    // Wait for gladiator cards
    await page.waitForSelector('[data-testid^="gladiator-"]', { timeout: 10000 });
    
    // Open modal
    await page.locator('[data-testid^="gladiator-"]').first().click();
    await expect(page.locator('[data-testid="close-modal"]')).toBeVisible();
    
    // Close modal
    await page.locator('[data-testid="close-modal"]').click();
    
    // Modal should be hidden
    await expect(page.locator('[data-testid="close-modal"]')).not.toBeVisible();
  });

  test('closes modal when clicking outside', async ({ page }) => {
    // Wait for gladiator cards
    await page.waitForSelector('[data-testid^="gladiator-"]', { timeout: 10000 });
    
    // Open modal
    await page.locator('[data-testid^="gladiator-"]').first().click();
    await expect(page.locator('[data-testid="close-modal"]')).toBeVisible();
    
    // Click outside the modal (on the backdrop)
    await page.locator('.fixed.inset-0').click({ position: { x: 10, y: 10 } });
    
    // Modal should be hidden
    await expect(page.locator('[data-testid="close-modal"]')).not.toBeVisible();
  });

  test('shows hover effect on gladiator cards', async ({ page }) => {
    // Wait for gladiator cards
    await page.waitForSelector('[data-testid^="gladiator-"]', { timeout: 10000 });
    
    const firstCard = page.locator('[data-testid^="gladiator-"]').first();
    
    // Hover over the card
    await firstCard.hover();
    
    // Check for hover hint text
    await expect(firstCard.locator('text="Cliquez pour voir tous les détails"')).toBeVisible();
  });

  test('displays health bar correctly', async ({ page }) => {
    // Wait for gladiator cards
    await page.waitForSelector('[data-testid^="gladiator-"]', { timeout: 10000 });
    
    const firstCard = page.locator('[data-testid^="gladiator-"]').first();
    
    // Check health bar exists
    const healthBar = firstCard.locator('.h-2.bg-black\\/60');
    await expect(healthBar).toBeVisible();
    
    // Check health bar has fill
    const healthFill = healthBar.locator('.bg-gradient-to-r');
    await expect(healthFill).toBeVisible();
  });

  test('shows physical and historical info in modal when available', async ({ page }) => {
    // Wait for gladiator cards
    await page.waitForSelector('[data-testid^="gladiator-"]', { timeout: 10000 });
    
    // Open modal
    await page.locator('[data-testid^="gladiator-"]').first().click();
    await expect(page.locator('[data-testid="close-modal"]')).toBeVisible();
    
    const modal = page.locator('.fixed.inset-0');
    
    // Check if physical & historical section exists
    const physicalSection = modal.locator('text="Physique et Historique"');
    const sectionCount = await physicalSection.count();
    
    if (sectionCount > 0) {
      await expect(physicalSection).toBeVisible();
      
      // Check for physical condition or notable history if present
      const physicalCondition = modal.locator('text=/Condition Physique/');
      const notableHistory = modal.locator('text=/Histoire Notable/');
      
      const hasPhysical = await physicalCondition.count() > 0;
      const hasHistory = await notableHistory.count() > 0;
      
      expect(hasPhysical || hasHistory).toBeTruthy();
    }
  });

  test('responsive layout works on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    
    // Navigate to page
    await page.goto('/fr/initial-gladiators');
    
    // Wait for gladiator cards
    await page.waitForSelector('[data-testid^="gladiator-"]', { timeout: 10000 });
    
    // Cards should stack vertically on mobile
    const cards = page.locator('[data-testid^="gladiator-"]');
    const count = await cards.count();
    
    if (count > 1) {
      const firstCard = await cards.first().boundingBox();
      const secondCard = await cards.nth(1).boundingBox();
      
      // Second card should be below first card (not side by side)
      expect(secondCard?.y).toBeGreaterThan(firstCard?.y || 0);
    }
    
    // Modal should still work on mobile
    await cards.first().click();
    await expect(page.locator('[data-testid="close-modal"]')).toBeVisible();
  });

  test('displays conditions section only when gladiator has conditions', async ({ page }) => {
    // Wait for gladiator cards
    await page.waitForSelector('[data-testid^="gladiator-"]', { timeout: 10000 });
    
    // Try each gladiator card to find one with conditions
    const cards = page.locator('[data-testid^="gladiator-"]');
    const cardCount = await cards.count();
    
    for (let i = 0; i < cardCount; i++) {
      await cards.nth(i).click();
      
      const modal = page.locator('.fixed.inset-0');
      const conditionsSection = modal.locator('text="État et Conditions"');
      
      if (await conditionsSection.count() > 0) {
        // If conditions section exists, verify it has content
        await expect(conditionsSection).toBeVisible();
        
        // Check for at least one condition type
        const hasInjury = await modal.locator('text=/🩹.*Blessure/').count() > 0;
        const hasSickness = await modal.locator('text=/🤒.*Maladie/').count() > 0;
        const hasHandicap = await modal.locator('text=/♿.*Handicap/').count() > 0;
        const hasPower = await modal.locator('text=/⚡.*Pouvoir Unique/').count() > 0;
        
        expect(hasInjury || hasSickness || hasHandicap || hasPower).toBeTruthy();
        
        // Close modal and exit loop
        await page.locator('[data-testid="close-modal"]').click();
        break;
      }
      
      // Close modal and try next card
      await page.locator('[data-testid="close-modal"]').click();
    }
  });
});
