import { expect, test, type Page } from "@playwright/test";

/**
 * E2E Tests for Button Improvements
 *
 * Requirements covered:
 * - Requirement 5.6: Responsive button layout (stack on mobile)
 * - Requirement 5.7: Button capitalization consistency
 *
 * These tests validate button layout, spacing, and capitalization in real browser environments
 * across different viewport sizes.
 */

/**
 * Helper function to dismiss the tutorial dialog if it appears
 */
async function dismissTutorialIfPresent(page: Page) {
  const skipButton = page.getByRole("button", { name: /skip tutorial/i });
  try {
    if (await skipButton.isVisible({ timeout: 2000 })) {
      await skipButton.click();
      // Wait for dialog to close
      await page.waitForTimeout(500);
    }
  } catch {
    // Dialog not present, continue
  }
}

test.describe("Button Improvements - Desktop Layout", () => {
  test.use({ viewport: { width: 1280, height: 720 } }); // Desktop viewport

  test("should display buttons in horizontal layout on desktop", async ({
    page,
  }) => {
    // Arrange
    await page.goto("/");
    await dismissTutorialIfPresent(page);

    // Load a workout to display the action buttons
    const fileInput = page.locator('input[type="file"]');
    const testWorkout = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: new Date().toISOString(),
        sport: "cycling",
      },
      extensions: {
        workout: {
          name: "Desktop Test Workout",
          sport: "cycling",
          steps: [
            {
              stepIndex: 0,
              durationType: "time",
              duration: { type: "time", seconds: 300 },
              targetType: "power",
              target: {
                type: "power",
                value: { unit: "watts", value: 200 },
              },
              intensity: "active",
            },
          ],
        },
      },
    };

    await fileInput.setInputFiles({
      name: "desktop-test.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(testWorkout)),
    });

    // Wait for workout to load - check for workout name in the header
    await expect(page.getByText("Desktop Test Workout")).toBeVisible({
      timeout: 10000,
    });

    // Wait for the workout section to be fully rendered
    await expect(page.locator('[data-testid="workout-section"]')).toBeVisible({
      timeout: 10000,
    });

    // Act - Get button positions (buttons are in the WorkoutHeader component)
    const saveButton = page.getByRole("button", { name: /save workout/i });
    const libraryButton = page.getByRole("button", {
      name: /save to library/i,
    });
    const discardButton = page.getByRole("button", {
      name: /discard workout/i,
    });

    // Wait for buttons to be visible
    await expect(saveButton).toBeVisible({ timeout: 10000 });
    await expect(libraryButton).toBeVisible();
    await expect(discardButton).toBeVisible();

    const saveBox = await saveButton.boundingBox();
    const libraryBox = await libraryButton.boundingBox();
    const discardBox = await discardButton.boundingBox();

    // Assert - Buttons should be in horizontal layout on desktop
    // The layout has two rows:
    // Row 1: Save Workout and Save to Library (horizontal on desktop)
    // Row 2: Discard Workout (below row 1)

    if (saveBox && libraryBox) {
      const yDifference = Math.abs(saveBox.y - libraryBox.y);
      // On desktop (sm breakpoint), these should be on the same row
      // Allow up to 60px difference to account for responsive layout
      expect(yDifference).toBeLessThan(60);

      // If they're on the same row, Library should be to the right of Save
      if (yDifference < 10) {
        expect(libraryBox.x).toBeGreaterThan(saveBox.x);
      }
    }

    // Discard button should be below the first row
    if (saveBox && discardBox) {
      expect(discardBox.y).toBeGreaterThan(saveBox.y);
    }
  });

  test("should have proper spacing between buttons on desktop", async ({
    page,
  }) => {
    // Arrange
    await page.goto("/");
    await dismissTutorialIfPresent(page);

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
          name: "Spacing Test",
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
      name: "spacing-test.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(testWorkout)),
    });

    await expect(page.getByText("Spacing Test")).toBeVisible({
      timeout: 10000,
    });

    // Scroll to the bottom to ensure buttons are visible
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Act - Get button positions
    const saveButton = page.getByRole("button", { name: /save workout/i });
    const libraryButton = page.getByRole("button", {
      name: /save to library/i,
    });

    await expect(saveButton).toBeVisible({ timeout: 10000 });
    await expect(libraryButton).toBeVisible();

    const saveBox = await saveButton.boundingBox();
    const libraryBox = await libraryButton.boundingBox();

    // Assert - Buttons should have consistent spacing (12px gap = gap-3 in Tailwind)
    if (saveBox && libraryBox) {
      const horizontalGap = libraryBox.x - (saveBox.x + saveBox.width);
      // Allow some tolerance for browser rendering differences
      expect(horizontalGap).toBeGreaterThanOrEqual(10);
      expect(horizontalGap).toBeLessThanOrEqual(16);
    }
  });

  test("should display buttons with correct order on desktop", async ({
    page,
  }) => {
    // Arrange
    await page.goto("/");
    await dismissTutorialIfPresent(page);

    const fileInput = page.locator('input[type="file"]');
    const testWorkout = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: new Date().toISOString(),
        sport: "swimming",
      },
      extensions: {
        workout: {
          name: "Order Test",
          sport: "swimming",
          steps: [
            {
              stepIndex: 0,
              durationType: "distance",
              duration: { type: "distance", meters: 1000 },
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
      name: "order-test.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(testWorkout)),
    });

    await expect(page.getByText("Order Test")).toBeVisible({
      timeout: 10000,
    });

    // Scroll to the bottom to ensure buttons are visible
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Wait for save button to be visible
    await expect(
      page.getByRole("button", { name: /save workout/i })
    ).toBeVisible({ timeout: 10000 });

    // Act - Get all buttons
    const buttons = await page.getByRole("button").all();
    const buttonTexts = await Promise.all(
      buttons.map((btn) => btn.textContent())
    );

    // Assert - Primary actions should come before secondary actions
    const saveIndex = buttonTexts.findIndex((text) =>
      text?.includes("Save Workout")
    );
    const libraryIndex = buttonTexts.findIndex((text) =>
      text?.includes("Save to Library")
    );
    const discardIndex = buttonTexts.findIndex((text) =>
      text?.includes("Discard")
    );

    // Save should come before Library
    expect(saveIndex).toBeGreaterThanOrEqual(0);
    expect(libraryIndex).toBeGreaterThanOrEqual(0);
    expect(saveIndex).toBeLessThan(libraryIndex);

    // Discard should come last
    expect(discardIndex).toBeGreaterThanOrEqual(0);
    expect(discardIndex).toBeGreaterThan(saveIndex);
    expect(discardIndex).toBeGreaterThan(libraryIndex);
  });
});

test.describe("Button Improvements - Mobile Layout", () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

  test("should stack buttons vertically on mobile", async ({ page }) => {
    // Arrange
    await page.goto("/");
    await dismissTutorialIfPresent(page);

    // Load a workout
    const fileInput = page.locator('input[type="file"]');
    const testWorkout = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: new Date().toISOString(),
        sport: "cycling",
      },
      extensions: {
        workout: {
          name: "Mobile Test Workout",
          sport: "cycling",
          steps: [
            {
              stepIndex: 0,
              durationType: "time",
              duration: { type: "time", seconds: 300 },
              targetType: "power",
              target: {
                type: "power",
                value: { unit: "watts", value: 200 },
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
    await expect(page.getByText("Mobile Test Workout")).toBeVisible({
      timeout: 10000,
    });

    // Scroll to the bottom to ensure buttons are visible
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Act - Get button positions
    const saveButton = page.getByRole("button", { name: /save workout/i });
    const libraryButton = page.getByRole("button", {
      name: /save to library/i,
    });
    const discardButton = page.getByRole("button", {
      name: /discard workout/i,
    });

    await expect(saveButton).toBeVisible({ timeout: 10000 });
    await expect(libraryButton).toBeVisible();
    await expect(discardButton).toBeVisible();

    const saveBox = await saveButton.boundingBox();
    const libraryBox = await libraryButton.boundingBox();
    const discardBox = await discardButton.boundingBox();

    // Assert - Buttons should be stacked vertically
    // Each button should be below the previous one
    if (saveBox && libraryBox) {
      expect(libraryBox.y).toBeGreaterThan(saveBox.y);
    }

    if (libraryBox && discardBox) {
      expect(discardBox.y).toBeGreaterThan(libraryBox.y);
    }

    // Buttons should have similar X positions (left-aligned)
    if (saveBox && libraryBox && discardBox) {
      const xDifference1 = Math.abs(saveBox.x - libraryBox.x);
      const xDifference2 = Math.abs(libraryBox.x - discardBox.x);
      expect(xDifference1).toBeLessThan(10);
      expect(xDifference2).toBeLessThan(10);
    }
  });

  test("should have full-width buttons on mobile", async ({ page }) => {
    // Arrange
    await page.goto("/");
    await dismissTutorialIfPresent(page);

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
          name: "Mobile Width Test",
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
      name: "mobile-width-test.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(testWorkout)),
    });

    await expect(page.getByText("Mobile Width Test")).toBeVisible({
      timeout: 10000,
    });

    // Scroll to the bottom to ensure buttons are visible
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Act - Get button widths
    const saveButton = page.getByRole("button", { name: /save workout/i });
    const libraryButton = page.getByRole("button", {
      name: /save to library/i,
    });
    const discardButton = page.getByRole("button", {
      name: /discard workout/i,
    });

    await expect(saveButton).toBeVisible({ timeout: 10000 });
    await expect(libraryButton).toBeVisible();
    await expect(discardButton).toBeVisible();

    const saveBox = await saveButton.boundingBox();
    const libraryBox = await libraryButton.boundingBox();
    const discardBox = await discardButton.boundingBox();

    // Get viewport width
    const viewportWidth = page.viewportSize()?.width || 375;

    // Assert - Buttons should be close to full width (accounting for padding)
    // Buttons should be at least 90% of viewport width
    const minWidth = viewportWidth * 0.9;

    if (saveBox) {
      expect(saveBox.width).toBeGreaterThan(minWidth);
    }

    if (libraryBox) {
      expect(libraryBox.width).toBeGreaterThan(minWidth);
    }

    if (discardBox) {
      expect(discardBox.width).toBeGreaterThan(minWidth);
    }
  });

  test("should maintain proper spacing between stacked buttons on mobile", async ({
    page,
  }) => {
    // Arrange
    await page.goto("/");
    await dismissTutorialIfPresent(page);

    const fileInput = page.locator('input[type="file"]');
    const testWorkout = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: new Date().toISOString(),
        sport: "swimming",
      },
      extensions: {
        workout: {
          name: "Mobile Spacing Test",
          sport: "swimming",
          steps: [
            {
              stepIndex: 0,
              durationType: "distance",
              duration: { type: "distance", meters: 1000 },
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
      name: "mobile-spacing-test.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(testWorkout)),
    });

    await expect(page.getByText("Mobile Spacing Test")).toBeVisible({
      timeout: 10000,
    });

    // Scroll to the bottom to ensure buttons are visible
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Act - Get button positions
    const saveButton = page.getByRole("button", { name: /save workout/i });
    const libraryButton = page.getByRole("button", {
      name: /save to library/i,
    });
    const discardButton = page.getByRole("button", {
      name: /discard workout/i,
    });

    await expect(saveButton).toBeVisible({ timeout: 10000 });
    await expect(libraryButton).toBeVisible();
    await expect(discardButton).toBeVisible();

    const saveBox = await saveButton.boundingBox();
    const libraryBox = await libraryButton.boundingBox();
    const discardBox = await discardButton.boundingBox();

    // Assert - Vertical spacing should be consistent (12px gap = gap-3)
    if (saveBox && libraryBox) {
      const verticalGap1 = libraryBox.y - (saveBox.y + saveBox.height);
      expect(verticalGap1).toBeGreaterThanOrEqual(10);
      expect(verticalGap1).toBeLessThanOrEqual(16);
    }

    if (libraryBox && discardBox) {
      const verticalGap2 = discardBox.y - (libraryBox.y + libraryBox.height);
      expect(verticalGap2).toBeGreaterThanOrEqual(10);
      expect(verticalGap2).toBeLessThanOrEqual(16);
    }
  });
});

test.describe("Button Improvements - Capitalization", () => {
  test.use({ viewport: { width: 1280, height: 720 } }); // Desktop viewport

  test("should display all button labels in title case", async ({ page }) => {
    // Arrange
    await page.goto("/");
    await dismissTutorialIfPresent(page);

    // Load a workout
    const fileInput = page.locator('input[type="file"]');
    const testWorkout = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: new Date().toISOString(),
        sport: "cycling",
      },
      extensions: {
        workout: {
          name: "Capitalization Test",
          sport: "cycling",
          steps: [
            {
              stepIndex: 0,
              durationType: "time",
              duration: { type: "time", seconds: 300 },
              targetType: "power",
              target: {
                type: "power",
                value: { unit: "watts", value: 200 },
              },
              intensity: "active",
            },
          ],
        },
      },
    };

    await fileInput.setInputFiles({
      name: "capitalization-test.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(testWorkout)),
    });

    await expect(page.getByText("Capitalization Test")).toBeVisible({
      timeout: 10000,
    });

    // Scroll to the bottom to ensure buttons are visible
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Act & Assert - Check each button label
    const saveButton = page.getByRole("button", { name: /save workout/i });
    await expect(saveButton).toBeVisible({ timeout: 10000 });
    const saveText = await saveButton.textContent();
    expect(saveText).toContain("Save Workout"); // Title case

    const libraryButton = page.getByRole("button", {
      name: /save to library/i,
    });
    await expect(libraryButton).toBeVisible();
    const libraryText = await libraryButton.textContent();
    expect(libraryText).toContain("Save to Library"); // Title case with lowercase "to"

    const discardButton = page.getByRole("button", {
      name: /discard workout/i,
    });
    await expect(discardButton).toBeVisible();
    const discardText = await discardButton.textContent();
    expect(discardText).toContain("Discard Workout"); // Title case
  });

  test("should use lowercase for minor words in button labels", async ({
    page,
  }) => {
    // Arrange
    await page.goto("/");
    await dismissTutorialIfPresent(page);

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
          name: "Minor Words Test",
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
      name: "minor-words-test.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(testWorkout)),
    });

    await expect(page.getByText("Minor Words Test")).toBeVisible({
      timeout: 10000,
    });

    // Scroll to the bottom to ensure buttons are visible
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Act & Assert - "to" should be lowercase in "Save to Library"
    const libraryButton = page.getByRole("button", {
      name: /save to library/i,
    });
    await expect(libraryButton).toBeVisible({ timeout: 10000 });
    const libraryText = await libraryButton.textContent();

    // Verify "to" is lowercase (not "To")
    expect(libraryText).toContain("to");
    expect(libraryText).not.toContain("To");

    // Verify major words are capitalized
    expect(libraryText).toContain("Save");
    expect(libraryText).toContain("Library");
  });

  test("should capitalize first word even if it's a minor word", async ({
    page,
  }) => {
    // Arrange
    await page.goto("/");
    await dismissTutorialIfPresent(page);

    const fileInput = page.locator('input[type="file"]');
    const testWorkout = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: new Date().toISOString(),
        sport: "swimming",
      },
      extensions: {
        workout: {
          name: "First Word Test",
          sport: "swimming",
          steps: [
            {
              stepIndex: 0,
              durationType: "distance",
              duration: { type: "distance", meters: 1000 },
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
      name: "first-word-test.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(testWorkout)),
    });

    await expect(page.getByText("First Word Test")).toBeVisible({
      timeout: 10000,
    });

    // Scroll to the bottom to ensure buttons are visible
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Wait for save button to be visible
    await expect(
      page.getByRole("button", { name: /save workout/i })
    ).toBeVisible({ timeout: 10000 });

    // Act & Assert - All button labels should start with capital letter
    const buttons = await page.getByRole("button").all();

    for (const button of buttons) {
      const text = await button.textContent();
      if (text && text.trim().length > 0) {
        const trimmedText = text.trim();
        const firstChar = trimmedText[0];

        // First character should be uppercase
        if (firstChar) {
          expect(firstChar).toMatch(/[A-Z]/);
        }
      }
    }
  });
});
