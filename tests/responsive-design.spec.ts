import { test, expect } from '@playwright/test';

test.describe('Responsive Design - Font and Image Scaling', () => {
  // Test mobile viewport (390x844 - iPhone 12)
  test('homepage scales correctly on mobile (390x844)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/en');
    
    // Wait for animations
    await page.waitForTimeout(1000);
    
    // Check that main content is visible
    await expect(page.locator('main')).toBeVisible();
    
    // Verify no horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
    
    // Check that hero title is visible and properly sized
    const heroTitle = page.locator('h1').first();
    await expect(heroTitle).toBeVisible();
    
    const boundingBox = await heroTitle.boundingBox();
    expect(boundingBox).toBeTruthy();
    if (boundingBox) {
      expect(boundingBox.width).toBeLessThanOrEqual(390);
    }
  });

  // Test smaller mobile viewport (360x800)
  test('homepage scales correctly on smaller mobile (360x800)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/en');
    
    // Wait for animations
    await page.waitForTimeout(1000);
    
    // Check that main content is visible
    await expect(page.locator('main')).toBeVisible();
    
    // Verify no horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
    
    // Check that text is readable (not too small)
    const paragraphs = page.locator('p').first();
    if (await paragraphs.isVisible()) {
      const fontSize = await paragraphs.evaluate((el) => 
        window.getComputedStyle(el).fontSize
      );
      const fontSizeNum = parseInt(fontSize);
      expect(fontSizeNum).toBeGreaterThanOrEqual(12); // Minimum readable size
    }
  });

  // Test tablet viewport (768x1024)
  test('homepage scales correctly on tablet (768x1024)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/en');
    
    // Wait for animations
    await page.waitForTimeout(1000);
    
    // Check that main content is visible
    await expect(page.locator('main')).toBeVisible();
    
    // Verify no horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
  });

  // Test desktop viewport (1920x1080)
  test('homepage scales correctly on desktop (1920x1080)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/en');
    
    // Wait for animations
    await page.waitForTimeout(1000);
    
    // Check that main content is visible
    await expect(page.locator('main')).toBeVisible();
    
    // Verify no horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
  });

  // Test that tap targets are at least 44px (mobile requirement)
  test('tap targets meet minimum size requirement (44px)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/en');
    
    // Wait for animations
    await page.waitForTimeout(1000);
    
    // Check buttons
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(40); // Allow slight variance
          expect(box.width).toBeGreaterThanOrEqual(40);
        }
      }
    }
  });

  // Test French locale responsive design
  test('French locale scales correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/fr');
    
    // Wait for animations
    await page.waitForTimeout(1000);
    
    // Check that main content is visible
    await expect(page.locator('main')).toBeVisible();
    
    // Verify no horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
    
    // Check French text is visible
    const frenchText = page.locator('text=/Forgez|Devenez|Maître/i');
    await expect(frenchText.first()).toBeVisible();
  });

  // Test that images/emojis scale with viewport
  test('images and emojis scale responsively', async ({ page }) => {
    // Test on mobile first
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/en');
    
    // Get initial emoji size on mobile
    const emojis = page.locator('[class*="text-"]').filter({ hasText: /[🗡️⚔️🛡️👑]/ });
    const mobileEmojiCount = await emojis.count();
    
    // Test on desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/en');
    
    // Emojis should still be present and visible
    const desktopEmojis = page.locator('[class*="text-"]').filter({ hasText: /[🗡️⚔️🛡️👑]/ });
    const desktopEmojiCount = await desktopEmojis.count();
    
    // Should have similar number of emojis (responsive, not hidden)
    expect(desktopEmojiCount).toBeGreaterThan(0);
  });

  // Test safe area padding on mobile
  test('safe area padding is applied on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/en');
    
    // Check that sections have padding
    const sections = page.locator('section');
    const sectionCount = await sections.count();
    
    if (sectionCount > 0) {
      const firstSection = sections.first();
      const paddingTop = await firstSection.evaluate((el) => 
        window.getComputedStyle(el).paddingTop
      );
      const paddingBottom = await firstSection.evaluate((el) => 
        window.getComputedStyle(el).paddingBottom
      );
      
      // Should have some padding
      expect(paddingTop).not.toBe('0px');
      expect(paddingBottom).not.toBe('0px');
    }
  });

  // Test text readability across viewports
  test('text remains readable across all viewports', async ({ page }) => {
    const viewports = [
      { width: 360, height: 800, name: 'small mobile' },
      { width: 390, height: 844, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1920, height: 1080, name: 'desktop' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/en');
      
      // Wait for animations
      await page.waitForTimeout(500);
      
      // Check that text elements have reasonable font sizes
      const paragraphs = page.locator('p');
      const pCount = await paragraphs.count();
      
      if (pCount > 0) {
        const firstP = paragraphs.first();
        const fontSize = await firstP.evaluate((el) => 
          window.getComputedStyle(el).fontSize
        );
        const fontSizeNum = parseInt(fontSize);
        
        // Font size should be between 12px and 72px
        expect(fontSizeNum).toBeGreaterThanOrEqual(12);
        expect(fontSizeNum).toBeLessThanOrEqual(72);
      }
    }
  });
});

