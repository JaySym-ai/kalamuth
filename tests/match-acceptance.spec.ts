import { test, expect } from "@playwright/test";

test.describe("Match Acceptance Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await page.goto("/login");
    await page.fill('input[name="email"]', "testplay@kalamuth.com");
    await page.fill('input[name="password"]', "testpassword123");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard");
  });

  test("should display match acceptance panel with countdown timer", async ({ page }) => {
    // Navigate to arena
    await page.click('a[href*="/arena"]');
    await page.waitForURL("**/arena/*");
    
    // Create a gladiator and join queue (this would be done through API in a real test)
    // For this test, we'll assume the user is already in queue and has been matched
    
    // Mock the API response for a pending acceptance match
    await page.route("/api/combat/match/*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          match: {
            id: "test-match-id",
            status: "pending_acceptance",
            acceptanceDeadline: new Date(Date.now() + 60000).toISOString(),
            gladiator1Id: "player-gladiator-id",
            gladiator2Id: "opponent-gladiator-id",
            // ... other match properties
          },
          gladiators: [
            {
              id: "player-gladiator-id",
              name: "Testus",
              surname: "Gladiatorius",
              health: 100,
              // ... other gladiator properties
            },
            {
              id: "opponent-gladiator-id",
              name: "Opponentus",
              surname: "Fighterus",
              health: 95,
              // ... other gladiator properties
            },
          ],
          acceptances: [
            {
              id: "acceptance-1",
              matchId: "test-match-id",
              gladiatorId: "player-gladiator-id",
              userId: "test-user-id",
              status: "pending",
              createdAt: new Date().toISOString(),
            },
            {
              id: "acceptance-2",
              matchId: "test-match-id",
              gladiatorId: "opponent-gladiator-id",
              userId: "opponent-user-id",
              status: "pending",
              createdAt: new Date().toISOString(),
            },
          ],
          logs: [],
        }),
      });
    });
    
    // Mock the match subscription to trigger the match acceptance panel
    await page.evaluate(() => {
      // Dispatch a custom event to simulate a match being found
      window.dispatchEvent(new CustomEvent("match-found", {
        detail: {
          matchId: "test-match-id",
          status: "pending_acceptance",
        },
      }));
    });
    
    // Check that the match acceptance panel is displayed
    await expect(page.locator("[data-testid='acceptance-countdown']")).toBeVisible();
    await expect(page.locator("[data-testid='player-gladiator-card']")).toBeVisible();
    await expect(page.locator("[data-testid='opponent-gladiator-card']")).toBeVisible();
    await expect(page.locator("[data-testid='accept-match-button']")).toBeVisible();
    await expect(page.locator("[data-testid='decline-match-button']")).toBeVisible();
    
    // Check that the opponent's name is displayed
    await expect(page.locator("[data-testid='opponent-gladiator-card']")).toContainText("Opponentus Fighterus");
    
    // Check that ranking points are NOT displayed
    await expect(page.locator("[data-testid='player-gladiator-card']")).not.toContainText("Ranking");
    await expect(page.locator("[data-testid='opponent-gladiator-card']")).not.toContainText("Ranking");
    
    // Check countdown timer is displayed
    await expect(page.locator("[data-testid='acceptance-countdown']")).toBeVisible();
    const countdownText = await page.locator("[data-testid='acceptance-countdown']").textContent();
    expect(countdownText).toMatch(/\d{2}:\d{2}/); // MM:SS format
  });

  test("should handle accept match flow", async ({ page }) => {
    // Navigate to arena
    await page.click('a[href*="/arena"]');
    await page.waitForURL("**/arena/*");
    
    // Mock the API responses
    await page.route("/api/combat/match/test-match-id/accept", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          acceptance: {
            id: "acceptance-1",
            matchId: "test-match-id",
            gladiatorId: "player-gladiator-id",
            userId: "test-user-id",
            status: "accepted",
            respondedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          },
          bothAccepted: false, // Opponent hasn't accepted yet
        }),
      });
    });
    
    // Mock the match details API
    await page.route("/api/combat/match/*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          match: {
            id: "test-match-id",
            status: "pending_acceptance",
            acceptanceDeadline: new Date(Date.now() + 60000).toISOString(),
            // ... other match properties
          },
          gladiators: [
            {
              id: "player-gladiator-id",
              name: "Testus",
              surname: "Gladiatorius",
              health: 100,
            },
            {
              id: "opponent-gladiator-id",
              name: "Opponentus",
              surname: "Fighterus",
              health: 95,
            },
          ],
          acceptances: [
            {
              id: "acceptance-1",
              matchId: "test-match-id",
              gladiatorId: "player-gladiator-id",
              userId: "test-user-id",
              status: "accepted",
              respondedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            },
            {
              id: "acceptance-2",
              matchId: "test-match-id",
              gladiatorId: "opponent-gladiator-id",
              userId: "opponent-user-id",
              status: "pending",
              createdAt: new Date().toISOString(),
            },
          ],
          logs: [],
        }),
      });
    });
    
    // Simulate match found
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent("match-found", {
        detail: {
          matchId: "test-match-id",
          status: "pending_acceptance",
        },
      }));
    });
    
    // Wait for the match acceptance panel to appear
    await expect(page.locator("[data-testid='accept-match-button']")).toBeVisible();
    
    // Click the accept button
    await page.click("[data-testid='accept-match-button']");
    
    // Check for success message
    await expect(page.locator("text=You accepted the combat")).toBeVisible();
    
    // Check that waiting for opponent message appears
    await expect(page.locator("[data-testid='waiting-opponent-message']")).toBeVisible();
    
    // Check that accepted icon appears
    await expect(page.locator("[data-testid='player-accepted-icon']")).toBeVisible();
    
    // Buttons should be hidden after responding
    await expect(page.locator("[data-testid='accept-match-button']")).not.toBeVisible();
    await expect(page.locator("[data-testid='decline-match-button']")).not.toBeVisible();
  });

  test("should handle decline match flow", async ({ page }) => {
    // Navigate to arena
    await page.click('a[href*="/arena"]');
    await page.waitForURL("**/arena/*");
    
    // Mock the API responses
    await page.route("/api/combat/match/test-match-id/decline", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          acceptance: {
            id: "acceptance-1",
            matchId: "test-match-id",
            gladiatorId: "player-gladiator-id",
            userId: "test-user-id",
            status: "declined",
            respondedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          },
          matchCancelled: true,
        }),
      });
    });
    
    // Mock the match details API
    await page.route("/api/combat/match/*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          match: {
            id: "test-match-id",
            status: "cancelled",
            // ... other match properties
          },
          gladiators: [
            {
              id: "player-gladiator-id",
              name: "Testus",
              surname: "Gladiatorius",
              health: 100,
            },
            {
              id: "opponent-gladiator-id",
              name: "Opponentus",
              surname: "Fighterus",
              health: 95,
            },
          ],
          acceptances: [
            {
              id: "acceptance-1",
              matchId: "test-match-id",
              gladiatorId: "player-gladiator-id",
              userId: "test-user-id",
              status: "declined",
              respondedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            },
            {
              id: "acceptance-2",
              matchId: "test-match-id",
              gladiatorId: "opponent-gladiator-id",
              userId: "opponent-user-id",
              status: "pending",
              createdAt: new Date().toISOString(),
            },
          ],
          logs: [],
        }),
      });
    });
    
    // Simulate match found
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent("match-found", {
        detail: {
          matchId: "test-match-id",
          status: "pending_acceptance",
        },
      }));
    });
    
    // Wait for the match acceptance panel to appear
    await expect(page.locator("[data-testid='decline-match-button']")).toBeVisible();
    
    // Click the decline button
    await page.click("[data-testid='decline-match-button']");
    
    // Check for success message
    await expect(page.locator("text=You declined the combat")).toBeVisible();
    
    // Check that declined icon appears
    await expect(page.locator("[data-testid='player-declined-icon']")).toBeVisible();
    
    // Buttons should be hidden after responding
    await expect(page.locator("[data-testid='accept-match-button']")).not.toBeVisible();
    await expect(page.locator("[data-testid='decline-match-button']")).not.toBeVisible();
  });

  test("should handle both players accepting", async ({ page }) => {
    // Navigate to arena
    await page.click('a[href*="/arena"]');
    await page.waitForURL("**/arena/*");
    
    // Mock the API responses
    await page.route("/api/combat/match/test-match-id/accept", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          acceptance: {
            id: "acceptance-1",
            matchId: "test-match-id",
            gladiatorId: "player-gladiator-id",
            userId: "test-user-id",
            status: "accepted",
            respondedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          },
          bothAccepted: true, // Both players have accepted
        }),
      });
    });
    
    // Simulate match found
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent("match-found", {
        detail: {
          matchId: "test-match-id",
          status: "pending_acceptance",
        },
      }));
    });
    
    // Wait for the match acceptance panel to appear
    await expect(page.locator("[data-testid='accept-match-button']")).toBeVisible();
    
    // Click the accept button
    await page.click("[data-testid='accept-match-button']");
    
    // Check that the user is redirected to the combat page
    await page.waitForURL("**/combat/test-match-id");
    await expect(page.locator("h1")).toContainText("Combat Arena");
  });

  test("should handle timeout scenario", async ({ page }) => {
    // Navigate to arena
    await page.click('a[href*="/arena"]');
    await page.waitForURL("**/arena/*");
    
    // Mock the API responses
    await page.route("/api/combat/match/test-match-id/timeout", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "Match cancelled due to timeout",
          acceptances: [
            {
              id: "acceptance-1",
              matchId: "test-match-id",
              gladiatorId: "player-gladiator-id",
              userId: "test-user-id",
              status: "pending",
              createdAt: new Date().toISOString(),
            },
            {
              id: "acceptance-2",
              matchId: "test-match-id",
              gladiatorId: "opponent-gladiator-id",
              userId: "opponent-user-id",
              status: "pending",
              createdAt: new Date().toISOString(),
            },
          ],
        }),
      });
    });
    
    // Mock the match details API with an expired deadline
    await page.route("/api/combat/match/*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          match: {
            id: "test-match-id",
            status: "pending_acceptance",
            acceptanceDeadline: new Date(Date.now() - 1000).toISOString(), // 1 second ago
            // ... other match properties
          },
          gladiators: [
            {
              id: "player-gladiator-id",
              name: "Testus",
              surname: "Gladiatorius",
              health: 100,
            },
            {
              id: "opponent-gladiator-id",
              name: "Opponentus",
              surname: "Fighterus",
              health: 95,
            },
          ],
          acceptances: [
            {
              id: "acceptance-1",
              matchId: "test-match-id",
              gladiatorId: "player-gladiator-id",
              userId: "test-user-id",
              status: "pending",
              createdAt: new Date(Date.now() - 65000).toISOString(), // 65 seconds ago
            },
            {
              id: "acceptance-2",
              matchId: "test-match-id",
              gladiatorId: "opponent-gladiator-id",
              userId: "opponent-user-id",
              status: "pending",
              createdAt: new Date(Date.now() - 65000).toISOString(), // 65 seconds ago
            },
          ],
          logs: [],
        }),
      });
    });
    
    // Simulate match found
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent("match-found", {
        detail: {
          matchId: "test-match-id",
          status: "pending_acceptance",
        },
      }));
    });
    
    // Wait for the match acceptance panel to appear
    await expect(page.locator("[data-testid='acceptance-countdown']")).toBeVisible();
    
    // Check that the countdown shows 00:00 (expired)
    await expect(page.locator("[data-testid='acceptance-countdown']")).toContainText("00:00");
    
    // Check for timeout error message
    await expect(page.locator("text=Combat request expired")).toBeVisible();
    
    // Buttons should be disabled when expired
    await expect(page.locator("[data-testid='accept-match-button']")).toBeDisabled();
    await expect(page.locator("[data-testid='decline-match-button']")).toBeDisabled();
  });
});