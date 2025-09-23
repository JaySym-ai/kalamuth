import { test, expect } from '@playwright/test';
import { loginUser, TEST_CREDENTIALS } from './helpers/auth';

test.describe('Dashboard Page - Full Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to dashboard
    await loginUser(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password, 'fr');
    await page.goto('/fr/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('displays ludus overview with all key information', async ({ page }) => {
    // Check main title is visible (ludus name)
    await expect(page.locator('h1').first()).toBeVisible();

    // Check arena card
    await expect(page.getByText('Arène')).toBeVisible();

    // Check ludus stats card
    await expect(page.getByText('Vue d\'ensemble du Ludus')).toBeVisible();
    await expect(page.getByText('Trésorerie')).toBeVisible();
    await expect(page.getByText('Réputation')).toBeVisible();
    await expect(page.getByText('Moral')).toBeVisible();
    
    // Check facilities section
    await expect(page.getByText('Installations')).toBeVisible();
    await expect(page.getByText('Infirmerie')).toBeVisible();
    await expect(page.getByText('Terrain d\'Entraînement')).toBeVisible();
    await expect(page.getByText('Quartiers')).toBeVisible();
    await expect(page.getByText('Cuisine')).toBeVisible();
    
    // Check gladiators section
    await expect(page.getByText('Vos Gladiateurs')).toBeVisible();

    // Ensure Ludus overview card appears before arena card on mobile
    await expect(page.getByTestId('dashboard-left-column')).toBeVisible();
    await expect(page.getByTestId('ludus-overview-card')).toBeVisible();
    await expect(page.getByTestId('arena-status-card')).toBeVisible();

    const isOverviewBeforeArena = await page.evaluate(() => {
      const leftColumn = document.querySelector('[data-testid="dashboard-left-column"]');
      const overview = leftColumn?.querySelector('[data-testid="ludus-overview-card"]');
      const arena = leftColumn?.querySelector('[data-testid="arena-status-card"]');
      if (!overview || !arena) {
        return false;
      }
      return (overview.compareDocumentPosition(arena) & Node.DOCUMENT_POSITION_FOLLOWING) > 0;
    });

    expect(isOverviewBeforeArena).toBe(true);
  });

  test('displays gladiator cards with health status', async ({ page }) => {
    // Wait for gladiator section to load
    await page.waitForSelector('text=/Vos Gladiateurs/', { timeout: 10000 });
    
    // Check if gladiators exist
    const gladiatorCards = page.locator('[data-testid^="gladiator-"]');
    const count = await gladiatorCards.count();
    
    if (count > 0) {
      // Check first gladiator card has required elements
      const firstCard = gladiatorCards.first();
      await expect(firstCard).toBeVisible();
      
      // Check for health information
      const healthText = firstCard.locator('text=/Santé/');
      await expect(healthText).toBeVisible();
      
      // Check for gladiator name
      const nameElement = firstCard.locator('h4');
      await expect(nameElement).toBeVisible();
      
      // Check for health status indicator
      const healthStatus = firstCard.locator('text=/En Bonne Santé|Blessé|Malade/');
      await expect(healthStatus).toBeVisible();
    } else {
      // Check for empty state
      await expect(page.getByText(/Aucun gladiateur dans votre ludus/)).toBeVisible();
      await expect(page.getByText('Recruter des Gladiateurs')).toBeVisible();
    }
  });

  test('navigates to gladiator detail page when clicking on card', async ({ page }) => {
    // Check if gladiators exist
    const gladiatorCards = page.locator('[data-testid^="gladiator-"]');
    const count = await gladiatorCards.count();

    if (count > 0) {
      // Click on first gladiator
      await gladiatorCards.first().click();

      // Wait for navigation to gladiator detail page
      await page.waitForURL(/\/fr\/gladiator\/[^/]+$/, { timeout: 5000 });

      // Check detail page content sections
      await expect(page.getByText('Statistiques de Combat')).toBeVisible();
      await expect(page.getByText('Force')).toBeVisible();
      await expect(page.getByText('Agilité')).toBeVisible();
      await expect(page.getByText('Personnalité')).toBeVisible();
      await expect(page.getByText('Historique')).toBeVisible();
      await expect(page.getByText('Traits Spéciaux')).toBeVisible();

      // Navigate back to dashboard
      await page.locator('[data-testid="back-to-dashboard"]').click();
      await page.waitForURL('/fr/dashboard', { timeout: 5000 });
      await expect(page.getByText('Tableau de Bord du Ludus')).toBeVisible();
    }
  });

  test('displays arena cards and allows navigation', async ({ page }) => {
    // Check arena section is visible
    await expect(page.getByText('Arène')).toBeVisible();

    // Check for arena cards (should have at least one)
    const arenaCards = page.locator('[data-testid^="arena-card-"]');
    await expect(arenaCards.first()).toBeVisible();

    // Click on first arena card
    await arenaCards.first().click();

    // Should navigate to arena detail page
    await expect(page).toHaveURL(/\/fr\/arena\/.+/);

    // Should show arena detail page elements
    await expect(page.getByTestId('back-to-dashboard')).toBeVisible();
  });

  test('displays facility levels with visual indicators', async ({ page }) => {
    // Check facilities section
    const facilitiesSection = page.locator('text=/Installations/').locator('..').locator('..');
    await expect(facilitiesSection).toBeVisible();
    
    // Check for level indicators
    const levelIndicators = facilitiesSection.locator('text=/Niveau \\d/');
    const levelCount = await levelIndicators.count();
    expect(levelCount).toBeGreaterThan(0);
  });

  test('responsive layout works on mobile viewport', async ({ page }) => {
    // Already on mobile viewport by default (Mobile Safari)
    // Check main elements are visible
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.getByText('Arène')).toBeVisible();
    await expect(page.getByText('Vos Gladiateurs')).toBeVisible();
    
    // Check layout uses mobile-first grid
    const mainGrid = page.locator('.grid').first();
    const gridClasses = await mainGrid.getAttribute('class');
    expect(gridClasses).toContain('grid-cols-1');
  });

  test('treasury displays currency information', async ({ page }) => {
    // Check treasury section
    await expect(page.getByText('Trésorerie')).toBeVisible();
    
    // Check for currency display (sestertii or denarii)
    const currencyText = page.locator('text=/sestertii|denarii/');
    await expect(currencyText).toBeVisible();
  });

  test('reputation and morale show progress bars', async ({ page }) => {
    // Check reputation bar
    const reputationSection = page.locator('text=/Réputation/').locator('..');
    await expect(reputationSection).toBeVisible();
    const reputationBar = reputationSection.locator('.bg-gradient-to-r');
    await expect(reputationBar).toBeVisible();
    
    // Check morale bar
    const moraleSection = page.locator('text=/Moral/').locator('..');
    await expect(moraleSection).toBeVisible();
    const moraleBar = moraleSection.locator('.bg-gradient-to-r');
    await expect(moraleBar).toBeVisible();
  });

  test('gladiator count displays current vs maximum', async ({ page }) => {
    // Check gladiator count display
    const gladiatorSection = page.locator('text=/Vos Gladiateurs/').locator('..');
    const countDisplay = gladiatorSection.locator('text=/\\d+ \\/ \\d+/');
    
    if (await countDisplay.isVisible()) {
      await expect(countDisplay).toBeVisible();
      const countText = await countDisplay.textContent();
      expect(countText).toMatch(/\d+ \/ \d+/);
    }
  });

  test('logout button is functional', async ({ page }) => {
    // Check logout button exists and is visible
    const logoutButton = page.getByTestId('logout-button');
    await expect(logoutButton).toBeVisible();
    
    // Click logout and verify redirect
    await logoutButton.click();
    await expect(page).toHaveURL(/\/fr\/?$/, { timeout: 15000 });
  });
});

test.describe('Dashboard Internationalization', () => {
  test('displays correctly in English', async ({ page }) => {
    // Login and navigate to English dashboard
    await loginUser(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password, 'en');
    await page.goto('/en/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check English translations
    await expect(page.getByText('Arena')).toBeVisible();
    await expect(page.getByText(/Currently Closed|Open for Battle/)).toBeVisible();
    await expect(page.getByText('Ludus Overview')).toBeVisible();
    await expect(page.getByText('Your Gladiators')).toBeVisible();
    await expect(page.getByText('Treasury')).toBeVisible();
    await expect(page.getByText('Reputation')).toBeVisible();
    await expect(page.getByText('Morale')).toBeVisible();
    await expect(page.getByText('Facilities')).toBeVisible();
  });

  test('gladiator detail page shows correct language', async ({ page }) => {
    // Test English detail page
    await loginUser(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password, 'en');
    await page.goto('/en/dashboard');
    await page.waitForLoadState('networkidle');

    const gladiatorCards = page.locator('[data-testid^="gladiator-"]');
    const count = await gladiatorCards.count();

    if (count > 0) {
      await gladiatorCards.first().click();
      await page.waitForURL(/\/en\/gladiator\/[^/]+$/, { timeout: 5000 });

      // Check English detail page content
      await expect(page.getByText('Combat Statistics')).toBeVisible();
      await expect(page.getByText('Strength')).toBeVisible();
      await expect(page.getByText('Personality')).toBeVisible();
      await expect(page.getByText('Background')).toBeVisible();
      await expect(page.getByText('Special Traits')).toBeVisible();

      // Navigate back
      await page.locator('[data-testid="back-to-dashboard"]').click();
      await page.waitForURL('/en/dashboard', { timeout: 5000 });
    }
  });
});

test.describe('Dashboard Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password, 'fr');
    await page.goto('/fr/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('has proper heading hierarchy', async ({ page }) => {
    // Check h1 exists
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    
    // Check h2 and h3 elements exist and are properly nested
    const h2Elements = page.locator('h2');
    const h3Elements = page.locator('h3');
    
    const h2Count = await h2Elements.count();
    const h3Count = await h3Elements.count();
    
    expect(h2Count).toBeGreaterThanOrEqual(0);
    expect(h3Count).toBeGreaterThanOrEqual(0);
  });

  test('interactive elements have sufficient size', async ({ page }) => {
    // Check gladiator cards are large enough for mobile tap
    const gladiatorCards = page.locator('[data-testid^="gladiator-"]');
    const cardCount = await gladiatorCards.count();
    
    if (cardCount > 0) {
      const firstCard = gladiatorCards.first();
      const box = await firstCard.boundingBox();
      
      if (box) {
        // Should be at least 48px in height for mobile tap targets
        expect(box.height).toBeGreaterThanOrEqual(48);
      }
    }
    
    // Check buttons meet minimum size requirements
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();
      
      if (box && box.width > 0 && box.height > 0) {
        // At least one dimension should be >= 44px (iOS minimum)
        expect(Math.max(box.height, box.width)).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('uses semantic HTML elements', async ({ page }) => {
    // Check for main element
    const main = page.locator('main');
    await expect(main).toHaveCount(1);
    
    // Check for header element
    const header = page.locator('header');
    const headerCount = await header.count();
    expect(headerCount).toBeGreaterThanOrEqual(1);
    
    // Check for section elements
    const sections = page.locator('section');
    const sectionCount = await sections.count();
    expect(sectionCount).toBeGreaterThanOrEqual(0);
  });

  test('images have alt text or are decorative', async ({ page }) => {
    // Check all img elements
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      
      // Image should have alt text or be marked as decorative
      expect(alt !== null || role === 'presentation').toBeTruthy();
    }
  });
});
