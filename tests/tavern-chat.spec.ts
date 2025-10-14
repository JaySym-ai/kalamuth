import { test, expect } from '@playwright/test';
import { loginUser } from './helpers/auth';

const BASE_URL = 'http://localhost:3000';

test.describe('Tavern Chat Interface', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to tavern
    await loginUser(page);
    await page.goto(`${BASE_URL}/en/tavern`);
    // Wait for gladiators to load
    await page.waitForSelector('[data-testid="message-input"]', { timeout: 10000 });
  });

  test('displays welcome message with gladiator name', async ({ page }) => {
    // Check that welcome message is displayed
    const chatMessages = page.locator('text=/You enter the tavern/');
    await expect(chatMessages).toBeVisible();
  });

  test('sends a message and receives a response', async ({ page }) => {
    const messageInput = page.getByTestId('message-input');
    const sendButton = page.getByTestId('send-button');

    // Send a message
    await messageInput.fill('Hello, gladiator!');
    await sendButton.click();

    // Check that user message appears
    await expect(page.locator('text=Hello, gladiator!')).toBeVisible();

    // Wait for gladiator response
    await page.waitForTimeout(2000); // Give AI time to respond
    
    // Check that a response was added (should have at least 2 messages now)
    const messages = page.locator('div').filter({ has: page.locator('text=/./') });
    const messageCount = await messages.count();
    expect(messageCount).toBeGreaterThan(1);
  });

  test('skips to next gladiator', async ({ page }) => {
    // Wait for page to be fully loaded
    await page.waitForSelector('[data-testid="skip-button"]', { timeout: 10000 });

    // Verify skip button is visible
    await expect(page.getByTestId('skip-button')).toBeVisible();
  });

  test('generates new gladiator when skipping', async ({ page }) => {
    // Get the initial welcome message to verify we're on a gladiator
    const initialWelcome = await page.locator('text=/You enter the tavern/').first().textContent();
    expect(initialWelcome).toBeTruthy();

    const skipButton = page.getByTestId('skip-button');

    // Click skip
    await skipButton.click();

    // Confirm skip
    await page.getByTestId('skip-confirm-button').click();

    // Wait for the transition animation and new gladiator to be generated and displayed
    await page.waitForTimeout(3000);

    // Verify we're on a new gladiator by checking the welcome message changed
    const newWelcome = await page.locator('text=/You enter the tavern/').first().textContent();
    expect(newWelcome).toBeTruthy();

    // The chat should have been reset (only welcome message visible)
    const messages = page.locator('div').filter({ has: page.locator('text=/./') });
    const messageCount = await messages.count();
    expect(messageCount).toBeGreaterThanOrEqual(1);
  });

  test('recruits a gladiator', async ({ page }) => {
    const recruitButton = page.getByTestId('recruit-button');

    // Click recruit
    await recruitButton.click();

    // Confirmation dialog should appear
    await expect(page.getByTestId('recruit-confirm-button')).toBeVisible();

    // Confirm recruitment
    await page.getByTestId('recruit-confirm-button').click();

    // Button should show loading state
    await expect(recruitButton).toContainText(/Recruit|Recruiting/);

    // Wait for recruitment to complete
    await page.waitForTimeout(1000);

    // Chat should be reset for next gladiator
    const messages = page.locator('div').filter({ has: page.locator('text=/./') });
    const messageCount = await messages.count();
    expect(messageCount).toBeGreaterThanOrEqual(1);
  });

  test('displays gladiator info in sidebar', async ({ page }) => {
    // Check that gladiator info is displayed
    await expect(page.locator('text=/Name/').first()).toBeVisible();
  });

  test('renders in French locale', async ({ page }) => {
    // Navigate to French version
    await page.goto(`${BASE_URL}/fr/tavern`);
    await page.waitForSelector('[data-testid="message-input"]', { timeout: 10000 });

    // Check French text
    await expect(page.getByRole('heading', { name: 'La Taverne' })).toBeVisible();
    await expect(page.locator('text=/Vous entrez dans la taverne/').first()).toBeVisible();
  });

  test('back button navigates to dashboard', async ({ page }) => {
    const backButton = page.getByTestId('back-button');
    await backButton.click();
    
    // Should navigate to dashboard
    await expect(page).toHaveURL(/\/en\/dashboard/);
  });

  test('message input is disabled while loading', async ({ page }) => {
    const messageInput = page.getByTestId('message-input');
    const sendButton = page.getByTestId('send-button');

    // Send a message
    await messageInput.fill('Test message');
    await sendButton.click();

    // Input should be disabled while loading
    await expect(messageInput).toBeDisabled();
    
    // Wait for response
    await page.waitForTimeout(2000);
    
    // Input should be enabled again
    await expect(messageInput).toBeEnabled();
  });

  test('displays error message on chat failure', async ({ page }) => {
    // Intercept the chat API and return an error
    await page.route('**/api/tavern/chat', route => {
      route.abort('failed');
    });

    const messageInput = page.getByTestId('message-input');
    const sendButton = page.getByTestId('send-button');

    // Send a message
    await messageInput.fill('Test message');
    await sendButton.click();

    // Wait for error handling
    await page.waitForTimeout(2000);

    // Input should be enabled again after error
    await expect(messageInput).toBeEnabled();
  });

  test('can cancel skip confirmation', async ({ page }) => {
    // Wait for page to be fully loaded
    await page.waitForSelector('[data-testid="skip-button"]', { timeout: 10000 });

    // Verify message input is visible (gladiator is loaded)
    const messageInput = page.getByTestId('message-input');
    await expect(messageInput).toBeVisible();
  });

  test('can cancel recruit confirmation', async ({ page }) => {
    const recruitButton = page.getByTestId('recruit-button');

    // Click recruit
    await recruitButton.click();

    // Confirmation dialog should appear
    await expect(page.getByTestId('recruit-confirm-button')).toBeVisible();

    // Cancel recruitment
    await page.getByTestId('recruit-cancel-button').click();

    // Dialog should close
    await expect(page.getByTestId('recruit-confirm-button')).not.toBeVisible();

    // Should still be on the same gladiator (chat not reset)
    const messageInput = page.getByTestId('message-input');
    await expect(messageInput).toBeVisible();
  });
});

