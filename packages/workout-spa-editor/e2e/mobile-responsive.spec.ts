import { expect, test } from "@playwright/test";

/**
 * Critical Path: Mobile Responsiveness and Touch Interactions
 *
 * Requirements covered:
 * - Requirement 8: Mobile-first responsive design
 * - Requirement 1: View workout on mobile devices
 */
test.describe("Mobile Responsive Design", () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

  test("should display mobile-optimized layout", async ({ page }) => {
    await page.goto("/");

    // Verify mobile layout is applied
    const container = page.locator("main");
    await expect(container).toBeVisible();

    // Verify touch targets are appropriately sized (minimum 44x44 pixels)
    const buttons = page.getByRole("button");
    const firstButton = buttons.first();
    const boundingBox = await firstButton.boundingBox();

    if (boundingBox) {
      expect(boundingBox.height).toBeGreaterThanOrEqual(44);
      expect(boundingBox.width).toBeGreaterThanOrEqual(44);
    }
  });

  test("should support touch gestures for navigation", async ({ page }) => {
    await page.goto("/");

    // Load a workout
    const fileInput = page.locator('input[type="file"]');
    const testWorkout = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: new Date().toISOString(),
        sport: "running",
      },
      extensions: {
        workout: {
          name: "Mobile Test",
          sport: "running",
          steps: [
            {
              stepIndex: 0,
              durationType: "time",
              duration: { type: "time", seconds: 600 },
              targetType: "pace",
              target: {
                type: "pace",
                value: { unit: "min_per_km", value: 5.0 },
              },
              intensity: "active",
            },
          ],
        },
      },
    };

    await fileInput.setInputFiles({
      name: "mobile-test.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(testWorkout)),
    });

    // Wait for workout to load
    await expect(page.getByText("Mobile Test")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Step 1")).toBeVisible();

    // Tap on the step to edit (touch interaction)
    const stepCard = page.locator('[data-testid="step-card"]').first();
    await stepCard.tap();

    // Verify editor opens
    await expect(page.getByText("Edit Step")).toBeVisible({ timeout: 5000 });
  });

  test("should scroll smoothly on mobile", async ({ page }) => {
    await page.goto("/");

    // Create a workout with many steps
    await page.getByRole("button", { name: /create new workout/i }).click();
    await page.getByLabel(/workout name/i).fill("Long Workout");
    await page.getByLabel(/sport/i).click();
    await page.getByRole("option", { name: /cycling/i }).click();
    await page.getByRole("button", { name: /create/i }).click();

    // Add multiple steps
    for (let i = 0; i < 5; i++) {
      await page.getByRole("button", { name: /add step/i }).click();
      await page.getByLabel(/duration value/i).fill("300");
      await page.getByLabel(/target value/i).fill("200");
      await page.getByRole("button", { name: /save step/i }).click();
    }

    // Verify all steps are added
    await expect(page.getByText("Step 5")).toBeVisible();

    // Scroll to the bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Verify last step is visible
    await expect(page.getByText("Step 5")).toBeVisible();

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));

    // Verify first step is visible
    await expect(page.getByText("Step 1")).toBeVisible();
  });
});

test.describe("Tablet Responsive Design", () => {
  test.use({ viewport: { width: 768, height: 1024 } }); // iPad size

  test("should adapt layout for tablet screens", async ({ page }) => {
    await page.goto("/");

    // Verify tablet layout
    const container = page.locator("main");
    await expect(container).toBeVisible();

    // Create a workout
    await page.getByRole("button", { name: /create new workout/i }).click();
    await page.getByLabel(/workout name/i).fill("Tablet Test");
    await page.getByLabel(/sport/i).click();
    await page.getByRole("option", { name: /swimming/i }).click();
    await page.getByRole("button", { name: /create/i }).click();

    // Verify workout is created
    await expect(page.getByText("Tablet Test")).toBeVisible();

    // Add a step
    await page.getByRole("button", { name: /add step/i }).click();
    await page.getByLabel(/duration value/i).fill("1200");
    await page.getByLabel(/target value/i).fill("140");
    await page.getByRole("button", { name: /save step/i }).click();

    // Verify step is visible
    await expect(page.getByText("Step 1")).toBeVisible();
  });
});
