import { test, expect } from '@playwright/test';
import { loginUser } from './helpers/auth';

// NOTE: This test validates that when a combat match completes, the winner stat shows
// the winner name followed by a trophy icon. It assumes the app auto-starts a battle
// on the combat page and emits completion with a winnerId.
//
// If you have a known matchId on the test server, set COMBAT_TEST_MATCH_ID in env or
// inject via CI to make this deterministic.
const MATCH_ID = process.env.COMBAT_TEST_MATCH_ID;
const LOCALE = process.env.TEST_LOCALE || 'en';

// Helper selector used by CombatStats component
const WINNER_SELECTOR = '[data-testid="combat-winner"]';

// Skip the test if no match id provided; this keeps CI green when no seed is available.
(MATCH_ID ? test : test.skip)(`combat winner shows name + trophy`, async ({ page }) => {
  await loginUser(page);

  // Navigate to a specific combat match page
  await page.goto(`/${LOCALE}/combat/${MATCH_ID}`);

  // Wait for the winner stat to appear after match completes
  const winnerEl = page.locator(WINNER_SELECTOR);
  await expect(winnerEl).toBeVisible({ timeout: 180000 }); // allow up to 3 minutes for a full simulation

  const text = await winnerEl.innerText();
  // It should contain a trophy
  expect(text).toContain('🏆');
  // And it should contain at least one letter besides the trophy (winner name)
  expect(text.replace('🏆', '').trim().length).toBeGreaterThan(0);
});

