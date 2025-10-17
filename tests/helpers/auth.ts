import { Page, expect } from '@playwright/test';

/**
 * Pre-created test accounts (must exist in the test server)
 *
 * All test accounts use the same password for simplicity.
 * These accounts should be created in the test server before running tests.
 */
export const TEST_CREDENTIALS = {
  // Primary test account - used in most tests
  primary: {
    email: 'test2@hotmail.com',
    password: 'qplsk8hothot',
  },
  // Secondary test accounts for multi-user scenarios
  secondary: {
    email: 'test3@hotmail.com',
    password: 'qplsk8hothot',
  },
  tertiary: {
    email: 'test4@hotmail.com',
    password: 'qplsk8hothot',
  },
  // Legacy test account (for backward compatibility with old tests)
  legacy: {
    email: 'testplay@kalamuth.com',
    password: 'testpassword123',
  },
  // Backward compatibility - direct access to email/password
  email: 'test2@hotmail.com',
  password: 'qplsk8hothot',
};

/**
 * Helper function to log in a user with existing credentials
 * Note: The test account must already exist in the test server
 *
 * @param page - Playwright page object
 * @param email - Email address (defaults to primary test account)
 * @param password - Password (defaults to primary test account password)
 * @param locale - Locale for the auth page (defaults to 'en')
 */
export async function loginUser(page: Page, email = TEST_CREDENTIALS.primary.email, password = TEST_CREDENTIALS.primary.password, locale = 'en') {
  // Clear any existing auth state first
  await clearAuthState(page);

  await page.goto(`/${locale}/auth`);
  await page.waitForLoadState('networkidle');

  // If already authenticated, nothing to do
  if (!page.url().includes('/auth')) {
    console.log('User already authenticated, skipping login');
    return;
  }

  // Login with existing credentials
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  await page.click('[data-testid="login-submit-button"]');

  const postAuthPattern = locale === 'en'
    ? /\/(en\/)?(server-selection|ludus-creation|initial-gladiators|dashboard|$)/
    : new RegExp(`\\/${locale}\\/(server-selection|ludus-creation|initial-gladiators|dashboard|$)`);
  await page.waitForURL(postAuthPattern, { timeout: 30000 });
  console.log('User logged in successfully');
}



/**
 * Helper function to log out a user
 */
export async function logoutUser(page: Page) {
  // Find and click logout button (stable selector)
  await page.getByTestId('logout-button').click();

  // Wait for redirect to home (can be /en or /)
  await expect(page).toHaveURL(/\/(en\/?)?$/, { timeout: 10000 });
}

/**
 * Helper function to check if user is authenticated by trying to access a protected route
 */
export async function isUserAuthenticated(page: Page): Promise<boolean> {
  const currentUrl = page.url();
  
  // Try to access a protected page
  await page.goto('/en/server-selection');

  // If redirected to auth page, user is not authenticated
  if (page.url().includes('/auth')) {
    // Restore original URL
    await page.goto(currentUrl);
    return false;
  }
  
  // If we can access server selection, user is authenticated
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
    await page.goto('/en/server-selection');
    await expect(page).toHaveURL(/\/en\/server-selection/, { timeout: 15000 });
  } else {
    // Wait until we're redirected to auth when accessing protected route
    await page.goto('/en/server-selection');
    // Auth redirect may include redirect parameter
    await expect(page).toHaveURL(/\/en\/auth/, { timeout: 15000 });
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

/**
 * Helper function to setup test user (alias for loginUser)
 * Note: The test account must already exist in the test server
 *
 * @param page - Playwright page object
 * @param email - Email address (defaults to primary test account)
 * @param password - Password (defaults to primary test account password)
 */
export async function setupTestUser(page: Page, email = TEST_CREDENTIALS.primary.email, password = TEST_CREDENTIALS.primary.password) {
  await loginUser(page, email, password);
}

/**
 * Helper function to cleanup test user (clears auth state)
 */
export async function cleanupTestUser(page: Page) {
  await clearAuthState(page);
}
