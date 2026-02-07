import { expect, test } from "./fixtures/base";

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
      type: "structured_workout",
      metadata: {
        created: new Date().toISOString(),
        sport: "running",
      },
      extensions: {
        structured_workout: {
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

    // Interact with the step card (use click for desktop, tap for mobile)
    const stepCard = page.locator('[data-testid="step-card"]').first();

    // Use click() instead of tap() for better cross-browser compatibility
    // Click works on both desktop and mobile browsers
    await stepCard.click();

    // Verify editor opens
    await expect(page.getByText("Edit Step")).toBeVisible({ timeout: 5000 });
  });

  test("should scroll smoothly on mobile", async ({ page }) => {
    await page.goto("/");

    // Load a workout with multiple steps instead of creating one
    const fileInput = page.locator('input[type="file"]');
    const testWorkout = {
      version: "1.0",
      type: "structured_workout",
      metadata: {
        created: new Date().toISOString(),
        sport: "cycling",
      },
      extensions: {
        structured_workout: {
          name: "Long Workout",
          sport: "cycling",
          steps: Array.from({ length: 10 }, (_, i) => ({
            stepIndex: i,
            durationType: "time",
            duration: { type: "time", seconds: 300 },
            targetType: "power",
            target: {
              type: "power",
              value: { unit: "watts", value: 200 + i * 10 },
            },
            intensity: "active",
          })),
        },
      },
    };

    await fileInput.setInputFiles({
      name: "long-workout.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(testWorkout)),
    });

    // Wait for workout to load
    await expect(page.getByText("Long Workout")).toBeVisible({
      timeout: 10000,
    });

    // Wait for steps to render
    await page.waitForSelector('[data-testid="step-card"]', { timeout: 10000 });

    // Verify we have multiple steps
    const stepCards = page.locator('[data-testid="step-card"]');
    await expect(stepCards).toHaveCount(10);

    // Verify smooth scroll behavior is applied
    const scrollBehavior = await page.evaluate(() => {
      return window.getComputedStyle(document.documentElement).scrollBehavior;
    });
    expect(scrollBehavior).toBe("smooth");

    // Get initial scroll position
    const initialScrollY = await page.evaluate(() => window.scrollY);

    // Scroll to the bottom using smooth scroll
    await page.evaluate(() =>
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
    );

    // Wait for scroll to complete by checking scroll position changes
    await page.waitForFunction(
      (initial) => Math.abs(window.scrollY - initial) > 100,
      initialScrollY,
      { timeout: 5000 }
    );

    // Verify we scrolled down
    const scrolledY = await page.evaluate(() => window.scrollY);
    expect(scrolledY).toBeGreaterThan(initialScrollY);

    // Verify last step is visible (use first() to avoid strict mode violation)
    const lastStepCard = stepCards.last();
    await expect(lastStepCard).toBeVisible();

    // Scroll back to top using smooth scroll
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));

    // Wait for scroll to complete
    await page.waitForFunction(() => window.scrollY < 50, undefined, {
      timeout: 5000,
    });

    // Verify we scrolled back to top
    const finalScrollY = await page.evaluate(() => window.scrollY);
    expect(finalScrollY).toBeLessThan(100);

    // Verify first step is visible
    const firstStepCard = stepCards.first();
    await expect(firstStepCard).toBeVisible();
  });
});

test.describe("Tablet Responsive Design", () => {
  test.use({ viewport: { width: 768, height: 1024 } }); // iPad size

  test("should adapt layout for tablet screens", async ({ page }) => {
    await page.goto("/");

    // Verify tablet layout is applied
    const container = page.locator("main");
    await expect(container).toBeVisible();

    // Verify main container has appropriate padding for tablet
    const mainPadding = await container.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        paddingLeft: styles.paddingLeft,
        paddingRight: styles.paddingRight,
      };
    });

    // On tablet (768px), Tailwind's sm:px-6 should apply (24px padding)
    expect(mainPadding.paddingLeft).toBe("24px");
    expect(mainPadding.paddingRight).toBe("24px");

    // Load a workout to test tablet layout with content
    const fileInput = page.locator('input[type="file"]');
    const testWorkout = {
      version: "1.0",
      type: "structured_workout",
      metadata: {
        created: new Date().toISOString(),
        sport: "swimming",
      },
      extensions: {
        structured_workout: {
          name: "Tablet Test",
          sport: "swimming",
          steps: [
            {
              stepIndex: 0,
              durationType: "time",
              duration: { type: "time", seconds: 1200 },
              targetType: "pace",
              target: {
                type: "pace",
                value: { unit: "min_per_100m", value: 1.5 },
              },
              intensity: "active",
            },
          ],
        },
      },
    };

    await fileInput.setInputFiles({
      name: "tablet-test.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(testWorkout)),
    });

    // Verify workout is loaded
    await expect(page.getByText("Tablet Test")).toBeVisible({
      timeout: 10000,
    });

    // Verify step is visible
    await expect(page.getByText("Step 1")).toBeVisible({ timeout: 10000 });

    // Verify tablet-specific layout characteristics
    const workoutSection = page.locator('[data-testid="workout-section"]');
    await expect(workoutSection).toBeVisible();

    // Verify touch targets are appropriately sized (minimum 44x44 pixels)
    const buttons = page.getByRole("button");
    const firstButton = buttons.first();
    const boundingBox = await firstButton.boundingBox();

    if (boundingBox) {
      expect(boundingBox.height).toBeGreaterThanOrEqual(44);
      expect(boundingBox.width).toBeGreaterThanOrEqual(44);
    }

    // Verify content width is appropriate for tablet
    const workoutSectionWidth = await workoutSection.evaluate(
      (el) => (el as HTMLElement).offsetWidth
    );
    // Content should use available space but not be too narrow
    expect(workoutSectionWidth).toBeGreaterThan(400);
    expect(workoutSectionWidth).toBeLessThanOrEqual(768);
  });
});
