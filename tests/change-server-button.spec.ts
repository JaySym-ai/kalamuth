import { test, expect } from '@playwright/test';
import { loginUser, TEST_CREDENTIALS } from './helpers/auth';

test.describe('Change Server Button', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to dashboard
    await loginUser(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password, 'en');
    await page.goto('/en/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('displays change server button in top right', async ({ page }) => {
    // Check that the change server button exists
    const changeServerButton = page.getByTestId('change-server-button');
    await expect(changeServerButton).toBeVisible();
    
    // Button should have globe icon
    const globeIcon = changeServerButton.locator('svg');
    await expect(globeIcon).toBeVisible();
  });

  test('opens server selection modal when clicked', async ({ page }) => {
    // Click the change server button
    const changeServerButton = page.getByTestId('change-server-button');
    await changeServerButton.click();
    
    // Modal should appear with title
    await expect(page.locator('text=Select a Server')).toBeVisible();
    await expect(page.locator('text=Choose which server to play on')).toBeVisible();
  });

  test('displays all available servers in modal', async ({ page }) => {
    // Click the change server button
    const changeServerButton = page.getByTestId('change-server-button');
    await changeServerButton.click();
    
    // Wait for modal to load
    await page.waitForLoadState('networkidle');
    
    // Check that server options are displayed
    const serverOptions = page.locator('[data-testid^="server-option-"]');
    const count = await serverOptions.count();
    expect(count).toBeGreaterThan(0);
  });

  test('shows ludus status for each server', async ({ page }) => {
    // Click the change server button
    const changeServerButton = page.getByTestId('change-server-button');
    await changeServerButton.click();
    
    // Wait for modal to load
    await page.waitForLoadState('networkidle');
    
    // Check for ludus status indicators
    const statusBadges = page.locator('text=/✓ Ludus exists|Create new ludus/');
    const count = await statusBadges.count();
    expect(count).toBeGreaterThan(0);
  });

  test('closes modal when close button is clicked', async ({ page }) => {
    // Click the change server button
    const changeServerButton = page.getByTestId('change-server-button');
    await changeServerButton.click();
    
    // Modal should be visible
    await expect(page.locator('text=Select a Server')).toBeVisible();
    
    // Click close button
    const closeButton = page.locator('button[aria-label="Close"]').first();
    await closeButton.click();
    
    // Modal should be gone
    await expect(page.locator('text=Select a Server')).not.toBeVisible();
  });

  test('closes modal when clicking outside', async ({ page }) => {
    // Click the change server button
    const changeServerButton = page.getByTestId('change-server-button');
    await changeServerButton.click();
    
    // Modal should be visible
    await expect(page.locator('text=Select a Server')).toBeVisible();
    
    // Click outside the modal
    await page.click('body', { position: { x: 10, y: 10 } });
    
    // Modal should be gone
    await expect(page.locator('text=Select a Server')).not.toBeVisible();
  });

  test('shows confirmation dialog when selecting server without ludus', async ({ page }) => {
    // Click the change server button
    const changeServerButton = page.getByTestId('change-server-button');
    await changeServerButton.click();
    
    // Wait for modal to load
    await page.waitForLoadState('networkidle');
    
    // Find a server without ludus (should show "Create new ludus")
    const serverWithoutLudus = page.locator('[data-testid^="server-option-"]').filter({
      has: page.locator('text=Create new ludus')
    }).first();
    
    if (await serverWithoutLudus.isVisible()) {
      // Click on server without ludus
      await serverWithoutLudus.click();
      
      // Confirmation dialog should appear
      await expect(page.locator('text=Switch Server?')).toBeVisible();
      await expect(page.locator('text=You don\'t have a ludus on this server')).toBeVisible();
    }
  });

  test('switches server when confirming ludus creation', async ({ page }) => {
    // Click the change server button
    const changeServerButton = page.getByTestId('change-server-button');
    await changeServerButton.click();
    
    // Wait for modal to load
    await page.waitForLoadState('networkidle');
    
    // Find a server without ludus
    const serverWithoutLudus = page.locator('[data-testid^="server-option-"]').filter({
      has: page.locator('text=Create new ludus')
    }).first();
    
    if (await serverWithoutLudus.isVisible()) {
      // Click on server without ludus
      await serverWithoutLudus.click();
      
      // Wait for confirmation dialog
      await expect(page.locator('text=Switch Server?')).toBeVisible();
      
      // Click confirm button
      const confirmButton = page.locator('button:has-text("Yes, Create Ludus")').first();
      await confirmButton.click();
      
      // Should redirect to ludus creation or server selection
      await page.waitForURL(/\/(en|fr)\/(ludus-creation|server-selection)/, { timeout: 10000 });
    }
  });

  test('cancels server switch when clicking cancel', async ({ page }) => {
    // Click the change server button
    const changeServerButton = page.getByTestId('change-server-button');
    await changeServerButton.click();
    
    // Wait for modal to load
    await page.waitForLoadState('networkidle');
    
    // Find a server without ludus
    const serverWithoutLudus = page.locator('[data-testid^="server-option-"]').filter({
      has: page.locator('text=Create new ludus')
    }).first();
    
    if (await serverWithoutLudus.isVisible()) {
      // Click on server without ludus
      await serverWithoutLudus.click();
      
      // Wait for confirmation dialog
      await expect(page.locator('text=Switch Server?')).toBeVisible();
      
      // Click cancel button
      const cancelButton = page.locator('button:has-text("Cancel")').first();
      await cancelButton.click();
      
      // Should still be on dashboard
      await expect(page).toHaveURL(/\/en\/dashboard/);
      
      // Modal should still be visible
      await expect(page.locator('text=Select a Server')).toBeVisible();
    }
  });

  test('displays correctly in French locale', async ({ page }) => {
    // Navigate to French dashboard
    await page.goto('/fr/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Click the change server button
    const changeServerButton = page.getByTestId('change-server-button');
    await changeServerButton.click();
    
    // Modal should appear with French text
    await expect(page.locator('text=Sélectionner un Serveur')).toBeVisible();
    await expect(page.locator('text=Choisissez sur quel serveur jouer')).toBeVisible();
  });

  test('button is positioned left of logout button', async ({ page }) => {
    // Get both buttons
    const changeServerButton = page.getByTestId('change-server-button');
    const logoutButton = page.getByTestId('logout-button');
    
    // Both should be visible
    await expect(changeServerButton).toBeVisible();
    await expect(logoutButton).toBeVisible();
    
    // Get bounding boxes
    const changeServerBox = await changeServerButton.boundingBox();
    const logoutBox = await logoutButton.boundingBox();
    
    // Change server button should be to the left of logout button
    if (changeServerBox && logoutBox) {
      expect(changeServerBox.x).toBeLessThan(logoutBox.x);
    }
  });
});

