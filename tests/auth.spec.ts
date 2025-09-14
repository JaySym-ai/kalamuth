import { test, expect } from '@playwright/test';

// Test user credentials - use a consistent test user
const TEST_EMAIL = 'playwright-test@kalamuth.com';
const TEST_PASSWORD = 'testpassword123';

test.describe('Authentication Flow', () => {
  // Setup: Create a test user that can be used for login tests
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    try {
      await page.goto('http://localhost:3001/en/auth');
      await page.click('text=New here? Create an account');
      await page.fill('input[type="email"]', TEST_EMAIL);
      await page.fill('input[type="password"]', TEST_PASSWORD);
      await page.fill('input[name="passwordConfirm"]', TEST_PASSWORD);
      await page.click('button[type="submit"]');
      // Wait a bit for registration to complete
      await page.waitForTimeout(2000);
    } catch (error) {
      // User might already exist, which is fine
      console.log('Test user setup:', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      await page.close();
    }
  });

  test.beforeEach(async ({ page }) => {
    // Start each test from the home page
    await page.goto('/');
  });

  test('should redirect unauthenticated users to auth page when accessing protected routes', async ({ page }) => {
    // Try to access onboarding page without authentication
    await page.goto('/en/onboarding');
    
    // Should be redirected to auth page
    await expect(page).toHaveURL(/\/en\/auth/);
    
    // Should see login form
    await expect(page.locator('h1')).toContainText('Welcome back');
  });

  test('should allow user registration with email and password', async ({ page }) => {
    // Use a unique email for registration test
    const testEmail = `reg-test-${Date.now()}@kalamuth.com`;

    // Navigate to auth page
    await page.goto('/en/auth');

    // Switch to register mode
    await page.click('text=New here? Create an account');

    // Should see register form
    await expect(page.locator('h1')).toContainText('Create your account');

    // Fill registration form
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.fill('input[name="passwordConfirm"]', TEST_PASSWORD);
    
    // Submit registration
    await page.click('button[type="submit"]');
    
    // Should redirect to onboarding after successful registration
    await expect(page).toHaveURL(/\/en\/onboarding/, { timeout: 10000 });
    
    // Should see onboarding page content
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should allow user login with email and password', async ({ page }) => {
    // Navigate to auth page
    await page.goto('/en/auth');
    
    // Should be in login mode by default
    await expect(page.locator('h1')).toContainText('Welcome back');
    
    // Fill login form
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    
    // Submit login
    await page.click('button[type="submit"]');
    
    // Should redirect to onboarding or home after successful login
    await page.waitForURL(/\/(en\/)?(onboarding|$)/, { timeout: 10000 });
    
    // Should not be on auth page anymore
    await expect(page).not.toHaveURL(/\/auth/);
  });

  test('should allow authenticated users to access protected routes', async ({ page }) => {
    // First, log in
    await page.goto('/en/auth');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for redirect after login
    await page.waitForURL(/\/(en\/)?(onboarding|$)/, { timeout: 10000 });
    
    // Now try to access onboarding page directly
    await page.goto('/en/onboarding');
    
    // Should be able to access onboarding page
    await expect(page).toHaveURL(/\/en\/onboarding/);
    await expect(page.locator('h1')).toBeVisible();
    
    // Should see logout button
    await expect(page.locator('button:has-text("Sign out")')).toBeVisible();
  });

  test('should handle logout correctly', async ({ page }) => {
    // First, log in
    await page.goto('/en/auth');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to onboarding
    await page.waitForURL(/\/en\/onboarding/, { timeout: 10000 });
    
    // Click logout button
    await page.click('button:has-text("Sign out")');
    
    // Should redirect to home page
    await expect(page).toHaveURL(/\/en\/?$/, { timeout: 10000 });
    
    // Try to access protected route after logout
    await page.goto('/en/onboarding');
    
    // Should be redirected to auth page
    await expect(page).toHaveURL(/\/en\/auth/);
  });

  test('should prevent authenticated users from accessing auth page', async ({ page }) => {
    // First, log in
    await page.goto('/en/auth');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for redirect after login
    await page.waitForURL(/\/(en\/)?(onboarding|$)/, { timeout: 10000 });
    
    // Try to access auth page while authenticated
    await page.goto('/en/auth');
    
    // Should be redirected away from auth page (to home or onboarding)
    await expect(page).not.toHaveURL(/\/auth/);
  });

  test('should handle invalid login credentials', async ({ page }) => {
    // Navigate to auth page
    await page.goto('/en/auth');
    
    // Fill login form with invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Submit login
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=Something went wrong')).toBeVisible({ timeout: 5000 });
    
    // Should still be on auth page
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should validate required fields in registration', async ({ page }) => {
    // Navigate to auth page
    await page.goto('/en/auth');
    
    // Switch to register mode
    await page.click('text=New here? Create an account');
    
    // Try to submit without filling fields
    await page.click('button[type="submit"]');
    
    // Should show validation error or stay on page
    await expect(page).toHaveURL(/\/auth/);
  });
});
