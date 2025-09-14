import { Page, expect } from '@playwright/test';

export const TEST_CREDENTIALS = {
  email: 'testplay@kalamuth.com',
  password: 'testpassword123',
};

/**
 * Helper function to log in a user
 */
export async function loginUser(page: Page, email = TEST_CREDENTIALS.email, password = TEST_CREDENTIALS.password, locale = 'en') {
  // Clear any existing auth state first
  await clearAuthState(page);

  await page.goto(`/${locale}/auth`);
  await page.waitForLoadState('networkidle');

  // Check if we're already authenticated (redirected away from auth page)
  if (!page.url().includes('/auth')) {
    console.log('User already authenticated, skipping login');
    return;
  }

  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  await page.click('[data-testid="login-submit-button"]');

  // Wait for successful login redirect (longer timeout for auth)
  const localePattern = locale === 'en' ? /\/(en\/)?(onboarding|$)/ : new RegExp(`\\/${locale}\\/(onboarding|$)`);
  await page.waitForURL(localePattern, { timeout: 15000 });
}

/**
 * Helper function to register a new user or login if user already exists
 * This function tries registration first, and if the user already exists, it will login instead
 */
export async function registerUser(page: Page, email = TEST_CREDENTIALS.email, password = TEST_CREDENTIALS.password) {
  // Clear any existing auth state first
  await clearAuthState(page);

  await page.goto('/en/auth');
  await page.waitForLoadState('networkidle');

  // Check if we're already authenticated (redirected away from auth page)
  if (!page.url().includes('/auth')) {
    console.log('User already authenticated, skipping registration');
    return;
  }

  // Switch to register mode
  await page.click('[data-testid="switch-to-register"]');

  // Fill registration form
  await page.fill('[data-testid="register-email-input"]', email);
  await page.fill('[data-testid="register-password-input"]', password);
  await page.fill('[data-testid="register-password-confirm-input"]', password);
  await page.check('[data-testid="terms-checkbox"]');

  // Submit registration
  await page.click('[data-testid="register-submit-button"]');

  try {
    // Wait for successful registration redirect
    await page.waitForURL(/\/en\/onboarding/, { timeout: 10000 });
    console.log('User registered successfully');
  } catch (error) {
    // If registration fails (user might already exist), try to login instead
    console.log('Registration failed, attempting login (user might already exist)');

    // Check if we're still on auth page or got redirected
    if (page.url().includes('/auth')) {
      // Switch back to login mode and try to login
      await page.click('[data-testid="switch-to-login"]');
      await page.fill('[data-testid="email-input"]', email);
      await page.fill('[data-testid="password-input"]', password);
      await page.click('[data-testid="login-submit-button"]');

      // Wait for login redirect
      await page.waitForURL(/\/(en\/)?(onboarding|$)/, { timeout: 15000 });
      console.log('User logged in successfully');
    } else {
      // If we're not on auth page, we might already be authenticated
      console.log('User might already be authenticated');
    }
  }
}

/**
 * Helper function to log out a user
 */
export async function logoutUser(page: Page) {
  // Find and click logout button
  await page.click('button:has-text("Sign out")');

  // Wait for redirect to home (can be /en or /)
  await expect(page).toHaveURL(/\/(en\/?)?$/, { timeout: 10000 });
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
    await page.goto('/en');
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
    await expect(page).toHaveURL(/\/en\/onboarding/, { timeout: 10000 });
  } else {
    // Wait until we're redirected to auth when accessing protected route
    await page.goto('/en/onboarding');
    // Auth redirect may include redirect parameter
    await expect(page).toHaveURL(/\/en\/auth/, { timeout: 10000 });
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
