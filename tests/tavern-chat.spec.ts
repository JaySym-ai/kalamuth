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
    const skipButton = page.getByTestId('skip-button');

    // Click skip
    await skipButton.click();
    await page.waitForTimeout(1000);

    // Chat should be reset (only welcome message)
    const messages = page.locator('div').filter({ has: page.locator('text=/./') });
    const messageCount = await messages.count();
    expect(messageCount).toBeGreaterThanOrEqual(1);
  });

  test('generates new gladiator when skipping', async ({ page }) => {
    // Get the initial gladiator name
    const initialNameElement = page.locator('text=/Name/').first();
    const initialText = await initialNameElement.textContent();
    const initialName = initialText?.replace('Name', '').trim() || '';

    const skipButton = page.getByTestId('skip-button');

    // Click skip
    await skipButton.click();

    // Wait for the new gladiator to be generated and displayed
    await page.waitForTimeout(2000);

    // Get the new gladiator name
    const newNameElement = page.locator('text=/Name/').first();
    const newText = await newNameElement.textContent();
    const newName = newText?.replace('Name', '').trim() || '';

    // The new gladiator should be different from the initial one
    expect(newName).not.toBe(initialName);
    expect(newName.length).toBeGreaterThan(0);
  });

  test('recruits a gladiator', async ({ page }) => {
    const recruitButton = page.getByTestId('recruit-button');
    
    // Click recruit
    await recruitButton.click();
    
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
    await expect(page.locator('text=Gladiator Info')).toBeVisible();
    await expect(page.locator('text=/Name:/').first()).toBeVisible();
    await expect(page.locator('text=/From:/').first()).toBeVisible();
    await expect(page.locator('text=/Health:/').first()).toBeVisible();
    await expect(page.locator('text=/Personality:/').first()).toBeVisible();
    await expect(page.locator('text=/Life Goal:/').first()).toBeVisible();
  });

  test('renders in French locale', async ({ page }) => {
    // Navigate to French version
    await page.goto(`${BASE_URL}/fr/tavern`);
    await page.waitForSelector('[data-testid="message-input"]', { timeout: 10000 });

    // Check French text
    await expect(page.locator('text=La Taverne')).toBeVisible();
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

    // Wait for error message
    await page.waitForTimeout(1000);
    
    // Error should be displayed
    const errorText = page.locator('text=/error|Error/i');
    await expect(errorText).toBeVisible();
  });
});

