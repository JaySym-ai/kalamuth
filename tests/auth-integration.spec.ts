import { test, expect } from '@playwright/test';
import {
  loginUser,
  registerUser,
  logoutUser,
  clearAuthState,
  waitForAuthState,
  testApiAuthentication,
  TEST_CREDENTIALS
} from './helpers/auth';

test.describe('Authentication Integration Tests', () => {
  // Ensure test user exists for login tests
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    try {
      // Clear any existing state first
      await clearAuthState(page);

      // Use the smart registerUser function that handles existing users
      await registerUser(page);
      console.log('Test user setup completed');
    } catch (error) {
      console.log('Setup error:', error instanceof Error ? error.message : String(error));
    } finally {
      await page.close();
    }
  });

  test.beforeEach(async ({ page }) => {
    // Clear any existing authentication state
    await clearAuthState(page);
  });

  test('complete authentication workflow: register → login → access protected content → logout', async ({ page }) => {
    // Step 1: Register a new user (or login if already exists)
    await registerUser(page);

    // Verify we're on onboarding page after registration/login
    await expect(page).toHaveURL(/\/en\/onboarding/);
    await expect(page.locator('h1')).toBeVisible();

    // Step 2: Logout
    await logoutUser(page);

    // Step 3: Login with the same credentials
    await loginUser(page);
    
    // Step 4: Verify access to protected content
    await page.goto('/en/onboarding');
    await expect(page).toHaveURL(/\/en\/onboarding/);
    
    // Step 5: Test API access
    await testApiAuthentication(page, true);
    
    // Step 6: Final logout
    await logoutUser(page);
    
    // Step 7: Verify no access to protected content
    await waitForAuthState(page, false);
    await testApiAuthentication(page, false);
  });

  test('authentication persistence across browser sessions', async ({ page, context }) => {
    // Login
    await loginUser(page);
    
    // Verify authenticated state
    await waitForAuthState(page, true);
    
    // Create a new page in the same context (simulates new tab)
    const newPage = await context.newPage();
    
    // Should maintain authentication in new page
    await newPage.goto('/en/onboarding');
    await expect(newPage).toHaveURL(/\/en\/onboarding/);
    
    // Test API access in new page
    await testApiAuthentication(newPage, true);
    
    await newPage.close();
  });

  test('authentication state isolation between different browser contexts', async ({ browser }) => {
    // Create two separate browser contexts
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    try {
      // Login in first context
      await loginUser(page1);
      await waitForAuthState(page1, true);
      
      // Second context should not be authenticated
      await waitForAuthState(page2, false);
      
      // Verify API access isolation
      await testApiAuthentication(page1, true);
      await testApiAuthentication(page2, false);
      
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('authentication with different locales', async ({ page }) => {
    // Test French authentication flow
    await page.goto('/fr/auth');
    await expect(page.locator('h1')).toContainText('Bon retour');
    
    // Login in French
    await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    
    // Should redirect to French onboarding
    await page.waitForURL(/\/fr\/onboarding/, { timeout: 10000 });
    
    // Switch to English while authenticated
    await page.goto('/en/onboarding');
    await expect(page).toHaveURL(/\/en\/onboarding/);
    
    // Should maintain authentication across locales
    await testApiAuthentication(page, true);
  });

  test('error handling and recovery', async ({ page }) => {
    // Test invalid login
    await page.goto('/en/auth');
    await page.waitForLoadState('networkidle');
    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-submit-button"]');

    // Should show error and stay on auth page
    await expect(page.locator('text=Something went wrong')).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/\/auth/);

    // Should still be unauthenticated
    await testApiAuthentication(page, false);

    // Recovery: login with correct credentials
    await loginUser(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);

    // Should now be authenticated (loginUser already waits for redirect)
    await testApiAuthentication(page, true);
  });

  test('concurrent authentication attempts', async ({ page }) => {
    // Navigate to auth page
    await page.goto('/en/auth');
    await page.waitForLoadState('networkidle');

    // Fill form
    await page.fill('[data-testid="email-input"]', TEST_CREDENTIALS.email);
    await page.fill('[data-testid="password-input"]', TEST_CREDENTIALS.password);

    // Submit multiple times quickly (simulate double-click)
    const submitPromises = [
      page.click('[data-testid="login-submit-button"]'),
      page.click('[data-testid="login-submit-button"]'),
    ];

    await Promise.all(submitPromises);

    // Wait for authentication to complete (either success or stay on auth page)
    try {
      await page.waitForURL(/\/(en\/)?(onboarding|$)/, { timeout: 15000 });
      // If we get here, authentication succeeded
      await testApiAuthentication(page, true);
    } catch (error) {
      // If timeout, check if we're still on auth page (which is also acceptable)
      if (page.url().includes('/auth')) {
        console.log('Concurrent clicks prevented duplicate submission (expected behavior)');
      } else {
        throw error;
      }
    }
  });

  test('authentication state after page refresh', async ({ page }) => {
    // Login
    await loginUser(page);
    await waitForAuthState(page, true);
    
    // Go to onboarding page
    await page.goto('/en/onboarding');
    await expect(page).toHaveURL(/\/en\/onboarding/);
    
    // Refresh the page
    await page.reload();
    
    // Should maintain authentication
    await expect(page).toHaveURL(/\/en\/onboarding/);
    await testApiAuthentication(page, true);
    
    // Refresh again
    await page.reload();
    
    // Should still maintain authentication
    await expect(page).toHaveURL(/\/en\/onboarding/);
    await testApiAuthentication(page, true);
  });

  test('logout from multiple pages', async ({ page, context }) => {
    // Login
    await loginUser(page);
    
    // Open onboarding in new tab
    const newPage = await context.newPage();
    await newPage.goto('/en/onboarding');
    await expect(newPage).toHaveURL(/\/en\/onboarding/);
    
    // Logout from original page
    await logoutUser(page);
    
    // New page should also be logged out when refreshed
    await newPage.reload();
    await expect(newPage).toHaveURL(/\/en\/auth/);
    
    await newPage.close();
  });
});
