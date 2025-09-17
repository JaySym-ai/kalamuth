import { test, expect } from '@playwright/test';
import { registerUser, TEST_CREDENTIALS } from './helpers/auth';

// Use shared test credentials
const TEST_EMAIL = TEST_CREDENTIALS.email;
const TEST_PASSWORD = TEST_CREDENTIALS.password;

test.describe('Authentication Flow', () => {
  // Setup: Create a test user that can be used for login tests
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    try {
      await page.goto('/en/auth');
      await page.click('[data-testid="switch-to-register"]');
      await page.fill('[data-testid="register-email-input"]', TEST_EMAIL);
      await page.fill('[data-testid="register-password-input"]', TEST_PASSWORD);
      await page.fill('[data-testid="register-password-confirm-input"]', TEST_PASSWORD);
      await page.check('[data-testid="terms-checkbox"]');
      await page.click('[data-testid="register-submit-button"]');
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
    // Try to access protected page without authentication
    await page.goto('/en/server-selection');

    // Should be redirected to auth page
    await expect(page).toHaveURL(/\/en\/auth/);

    // Should see login form
    await expect(page.locator('h1')).toContainText('Welcome back');
  });

  test('should allow user registration with email and password', async ({ page }) => {
    // Navigate to auth page to test the registration form UI
    await page.goto('/en/auth');

    // Switch to register mode
    await page.click('[data-testid="switch-to-register"]');

    // Should see register form
    await expect(page.locator('h1')).toContainText('Create your account');

    // Verify form elements are present
    await expect(page.locator('[data-testid="register-email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="register-password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="register-password-confirm-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="terms-checkbox"]')).toBeVisible();
    await expect(page.locator('[data-testid="register-submit-button"]')).toBeVisible();

    // Use registerUser helper which handles existing users gracefully
    await registerUser(page);

    // Should redirect into setup flow after successful registration/login
    await expect(page).toHaveURL(/\/en\/(server-selection|ludus-creation|initial-gladiators|dashboard)/, { timeout: 15000 });
  });

  test('should allow user login with email and password', async ({ page }) => {
    // Navigate to auth page
    await page.goto('/en/auth');

    // Should be in login mode by default
    await expect(page.locator('h1')).toContainText('Welcome back');

    // Fill login form
    await page.fill('[data-testid="email-input"]', TEST_EMAIL);
    await page.fill('[data-testid="password-input"]', TEST_PASSWORD);

    // Submit login
    await page.click('[data-testid="login-submit-button"]');
    
    // Should redirect into setup flow or dashboard after successful login
    await page.waitForURL(/\/(en\/)?(server-selection|ludus-creation|initial-gladiators|dashboard|$)/, { timeout: 15000 });
    
    // Should not be on auth page anymore
    await expect(page).not.toHaveURL(/\/auth/);
  });

  test('should allow authenticated users to access protected routes', async ({ page }) => {
    // First, log in
    await page.goto('/en/auth');
    await page.fill('[data-testid="email-input"]', TEST_EMAIL);
    await page.fill('[data-testid="password-input"]', TEST_PASSWORD);
    await page.click('[data-testid="login-submit-button"]');
    
    // Wait for redirect after login
    await page.waitForURL(/\/(en\/)?(server-selection|ludus-creation|initial-gladiators|dashboard|$)/, { timeout: 15000 });

    // Should see logout button in the header
    await expect(page.getByTestId('logout-button')).toBeVisible();
  });

  test('should handle logout correctly', async ({ page }) => {
    // First, log in
    await page.goto('/en/auth');
    await page.fill('[data-testid="email-input"]', TEST_EMAIL);
    await page.fill('[data-testid="password-input"]', TEST_PASSWORD);
    await page.click('[data-testid="login-submit-button"]');
    
    // Wait for redirect into app
    await page.waitForURL(/\/en\/(server-selection|ludus-creation|initial-gladiators|dashboard)/, { timeout: 15000 });

    // Click logout button
    await page.getByTestId('logout-button').click();

    // Should redirect to home page
    await expect(page).toHaveURL(/\/en\/?$/, { timeout: 15000 });

    // Try to access protected route after logout
    await page.goto('/en/server-selection');

    // Should be redirected to auth page
    await expect(page).toHaveURL(/\/en\/auth/);
  });

  test('should prevent authenticated users from accessing auth page', async ({ page }) => {
    // First, log in
    await page.goto('/en/auth');
    await page.fill('[data-testid="email-input"]', TEST_EMAIL);
    await page.fill('[data-testid="password-input"]', TEST_PASSWORD);
    await page.click('[data-testid="login-submit-button"]');
    
    // Wait for redirect after login
    await page.waitForURL(/\/(en\/)?(server-selection|ludus-creation|initial-gladiators|dashboard|$)/, { timeout: 15000 });

    // Try to access auth page while authenticated
    await page.goto('/en/auth');

    // Should be redirected away from auth page (to setup or dashboard)
    await expect(page).not.toHaveURL(/\/auth/);
  });

  test('should handle invalid login credentials', async ({ page }) => {
    // Navigate to auth page
    await page.goto('/en/auth');

    // Fill login form with invalid credentials
    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');

    // Submit login
    await page.click('[data-testid="login-submit-button"]');
    
    // Should show error message
    await expect(page.locator('text=Something went wrong')).toBeVisible({ timeout: 5000 });
    
    // Should still be on auth page
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should validate required fields in registration', async ({ page }) => {
    // Navigate to auth page
    await page.goto('/en/auth');

    // Switch to register mode
    await page.click('[data-testid="switch-to-register"]');

    // Try to submit without filling fields
    await page.click('[data-testid="register-submit-button"]');

    // Should show validation error or stay on page
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should toggle password visibility', async ({ page }) => {
    // Navigate to auth page
    await page.goto('/en/auth');

    // Password should be hidden by default
    const passwordInput = page.locator('[data-testid="password-input"]');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle button to show password
    await page.click('[data-testid="toggle-password-visibility"]');
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click again to hide password
    await page.click('[data-testid="toggle-password-visibility"]');
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should display Google sign-in button', async ({ page }) => {
    // Navigate to auth page
    await page.goto('/en/auth');

    // Should see Google sign-in button
    const googleButton = page.locator('[data-testid="google-signin-button"]');
    await expect(googleButton).toBeVisible();
    await expect(googleButton).toContainText('Continue with Google');
  });
});
