import { Page, expect } from '@playwright/test';

export const TEST_CREDENTIALS = {
  email: `test-${Date.now()}@kalamuth.com`,
  password: 'testpassword123',
};

/**
 * Helper function to log in a user
 */
export async function loginUser(page: Page, email = TEST_CREDENTIALS.email, password = TEST_CREDENTIALS.password) {
  await page.goto('/en/auth');
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  await page.click('[data-testid="login-submit-button"]');

  // Wait for successful login redirect
  await page.waitForURL(/\/(en\/)?(onboarding|$)/, { timeout: 10000 });
}

/**
 * Helper function to register a new user
 */
export async function registerUser(page: Page, email = TEST_CREDENTIALS.email, password = TEST_CREDENTIALS.password) {
  await page.goto('/en/auth');

  // Switch to register mode
  await page.click('[data-testid="switch-to-register"]');

  // Fill registration form
  await page.fill('[data-testid="register-email-input"]', email);
  await page.fill('[data-testid="register-password-input"]', password);
  await page.fill('[data-testid="register-password-confirm-input"]', password);
  await page.check('[data-testid="terms-checkbox"]');

  // Submit registration
  await page.click('[data-testid="register-submit-button"]');

  // Wait for successful registration redirect
  await page.waitForURL(/\/en\/onboarding/, { timeout: 10000 });
}

/**
 * Helper function to log out a user
 */
export async function logoutUser(page: Page) {
  // Find and click logout button
  await page.click('button:has-text("Sign out")');
  
  // Wait for redirect to home
  await expect(page).toHaveURL(/\/(en\/)?$/, { timeout: 10000 });
}

/**
 * Helper function to check if user is authenticated by trying to access a protected route
 */
export async function isUserAuthenticated(page: Page): Promise<boolean> {
  const currentUrl = page.url();
  
  // Try to access onboarding page
  await page.goto('/en/onboarding');
  
  // If redirected to auth page, user is not authenticated
  if (page.url().includes('/auth')) {
    // Restore original URL
    await page.goto(currentUrl);
    return false;
  }
  
  // If we can access onboarding, user is authenticated
  // Restore original URL
  await page.goto(currentUrl);
  return true;
}

/**
 * Helper function to clear authentication state
 */
export async function clearAuthState(page: Page) {
  await page.context().clearCookies();

  // Navigate to a page first to ensure we have access to localStorage
  try {
    await page.goto('http://localhost:3001/en');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  } catch (error) {
    // If localStorage access fails, just clear cookies
    console.log('Could not clear localStorage:', error);
  }
}

/**
 * Helper function to wait for authentication state to be established
 */
export async function waitForAuthState(page: Page, authenticated: boolean = true) {
  if (authenticated) {
    // Wait until we can access a protected route
    await page.goto('/en/onboarding');
    await expect(page).toHaveURL(/\/en\/onboarding/);
  } else {
    // Wait until we're redirected to auth when accessing protected route
    await page.goto('/en/onboarding');
    await expect(page).toHaveURL(/\/en\/auth/);
  }
}

/**
 * Helper function to test API authentication
 */
export async function testApiAuthentication(page: Page, shouldBeAuthenticated: boolean = true) {
  const response = await page.request.get('/api/user');
  
  if (shouldBeAuthenticated) {
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('onboardingDone');
  } else {
    expect(response.status()).toBe(401);
  }
}
