import { test, expect } from '@playwright/test';

test.describe('French Translations', () => {
  test('should display French translations on auth page', async ({ page }) => {
    // Navigate to French auth page
    await page.goto('http://localhost:3001/fr/auth');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that French translations are displayed
    await expect(page.locator('h1')).toContainText('Bon retour');
    await expect(page.locator('button:has-text("Continuer avec Google")')).toBeVisible();
    await expect(page.locator('span:has-text("ou")').first()).toBeVisible();
    await expect(page.getByText('E-mail').first()).toBeVisible();
    await expect(page.getByText('Mot de passe').first()).toBeVisible();
    await expect(page.locator('button:has-text("Se connecter")')).toBeVisible();
    await expect(page.locator('button:has-text("Nouveau ici ? Créez un compte")')).toBeVisible();
  });

  test('should display English translations on auth page', async ({ page }) => {
    // Navigate to English auth page
    await page.goto('http://localhost:3001/en/auth');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that English translations are displayed
    await expect(page.locator('h1')).toContainText('Welcome back');
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible();
    await expect(page.locator('span:has-text("or")').first()).toBeVisible();
    await expect(page.getByText('Email').first()).toBeVisible();
    await expect(page.getByText('Password').first()).toBeVisible();
    await expect(page.locator('button:has-text("Sign in")')).toBeVisible();
    await expect(page.locator('button:has-text("New here? Create an account")')).toBeVisible();
  });

  test('should switch between locales correctly', async ({ page }) => {
    // Start with English
    await page.goto('http://localhost:3001/en/auth');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Welcome back');
    
    // Switch to French
    await page.goto('http://localhost:3001/fr/auth');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Bon retour');
    
    // Switch back to English
    await page.goto('http://localhost:3001/en/auth');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Welcome back');
  });
});
