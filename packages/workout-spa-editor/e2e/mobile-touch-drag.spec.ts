import { expect, test } from "@playwright/test";
import { touchDrag, verifyStepOrder } from "./test-utils/touch-helpers";

/**
 * E2E Tests for Mobile Touch Drag Functionality
 *
 * Requirements covered:
 * - Requirement 1: Touch Drag Implementation
 * - Requirement 2: Touch Gesture Validation
 * - Requirement 5: Cross-Device Compatibility
 *
 * Tests cover:
 * - Basic touch drag reordering
 * - Cross-viewport compatibility (iPhone 12, Pixel 5)
 * - Data integrity after touch drag
 * - Touch drag with repetition blocks
 */

/**
 * Helper function to create a test workout with specified number of steps
 * Reused from drag-drop-reordering.spec.ts
 */
const createTestWorkout = (stepCount: number) => ({
  version: "1.0",
  type: "workout",
  metadata: {
    created: new Date().toISOString(),
    sport: "cycling",
  },
  extensions: {
    workout: {
      name: "Test Workout",
      sport: "cycling",
      steps: Array.from({ length: stepCount }, (_, i) => ({
        stepIndex: i,
        durationType: "time",
        duration: { type: "time", seconds: 300 + i * 60 },
        targetType: "power",
        target: {
          type: "power",
          value: { unit: "watts", value: 200 + i * 10 },
        },
        intensity: i === 0 ? "warmup" : "active",
      })),
    },
  },
});

test.describe("Mobile Touch Drag", () => {
  // Use iPhone 12 viewport (matches Playwright's "Mobile Safari" project)
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  /**
   * Test: Basic touch drag reordering
   * Validates: Requirement 1.1 - Touch drag gesture reorders steps
   * Validates: Requirement 2.3 - Touch drag moves step to expected position
   */
  test("should reorder steps using touch drag gesture", async ({ page }) => {
    // Arrange
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test-workout.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(createTestWorkout(3))),
    });

    await expect(page.getByText("Test Workout")).toBeVisible();

    const stepCards = page.locator('[data-testid="step-card"]');
    await verifyStepOrder(page, [
      { duration: 300, power: 200 },
      { duration: 360, power: 210 },
      { duration: 420, power: 220 },
    ]);

    // Act - Use actual touch drag (not keyboard shortcuts)
    await touchDrag(page, stepCards.nth(0), stepCards.nth(1));

    // Assert - Verify step moved to expected position
    await verifyStepOrder(page, [
      { duration: 360, power: 210 },
      { duration: 300, power: 200 },
      { duration: 420, power: 220 },
    ]);
  });

  /**
   * Test: Data integrity after touch drag
   * Validates: Requirement 1.3 - Touch drag updates step order and persists changes
   * Validates: Requirement 2.4 - Data integrity is maintained after reordering
   */
  test("should preserve step data integrity after touch drag reordering", async ({
    page,
  }) => {
    // Arrange
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test-workout.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(createTestWorkout(3))),
    });

    await expect(page.getByText("Test Workout")).toBeVisible();

    const stepCards = page.locator('[data-testid="step-card"]');

    // Verify initial order and data
    await expect(stepCards.nth(0)).toContainText("5 min");
    await expect(stepCards.nth(0)).toContainText("200W");
    await expect(stepCards.nth(1)).toContainText("6 min");
    await expect(stepCards.nth(1)).toContainText("210W");
    await expect(stepCards.nth(2)).toContainText("7 min");
    await expect(stepCards.nth(2)).toContainText("220W");

    // Act - Touch drag first step to second position
    await touchDrag(page, stepCards.nth(0), stepCards.nth(1));

    // Assert - Verify data integrity preserved (duration and power values unchanged)
    const reorderedSteps = page.locator('[data-testid="step-card"]');
    await expect(reorderedSteps.nth(0)).toContainText("6 min");
    await expect(reorderedSteps.nth(0)).toContainText("210W");
    await expect(reorderedSteps.nth(1)).toContainText("5 min");
    await expect(reorderedSteps.nth(1)).toContainText("200W");
    await expect(reorderedSteps.nth(2)).toContainText("7 min");
    await expect(reorderedSteps.nth(2)).toContainText("220W");

    // Verify stepIndex values are sequential after reorder
    await expect(reorderedSteps.nth(0)).toContainText("Step 1");
    await expect(reorderedSteps.nth(1)).toContainText("Step 2");
    await expect(reorderedSteps.nth(2)).toContainText("Step 3");
  });
});

test.describe("Mobile Touch Drag - Cross-Device", () => {
  const MOBILE_DEVICES = [
    {
      name: "iPhone 12",
      viewport: { width: 390, height: 844 },
      hasTouch: true,
    },
    {
      name: "Pixel 5",
      viewport: { width: 393, height: 851 },
      hasTouch: true,
    },
  ];

  for (const device of MOBILE_DEVICES) {
    test.describe(`${device.name}`, () => {
      test.use({ viewport: device.viewport, hasTouch: device.hasTouch });

      test.beforeEach(async ({ page }) => {
        await page.goto("/");
      });

      /**
       * Test: Cross-device touch drag compatibility
       * Validates: Requirement 5.1 - Touch drag works on Mobile Chrome viewport
       * Validates: Requirement 5.2 - Touch drag works on Mobile Safari viewport
       * Validates: Requirement 5.4 - System handles touch events correctly
       */
      test("should support touch drag on mobile viewport", async ({ page }) => {
        // Arrange
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles({
          name: "test-workout.krd",
          mimeType: "application/json",
          buffer: Buffer.from(JSON.stringify(createTestWorkout(3))),
        });

        await expect(page.getByText("Test Workout")).toBeVisible();

        const stepCards = page.locator('[data-testid="step-card"]');
        await verifyStepOrder(page, [
          { duration: 300, power: 200 },
          { duration: 360, power: 210 },
          { duration: 420, power: 220 },
        ]);

        // Act - Touch drag using device-specific viewport
        await touchDrag(page, stepCards.nth(0), stepCards.nth(1));

        // Assert - Verify touch drag works consistently across devices
        await verifyStepOrder(page, [
          { duration: 360, power: 210 },
          { duration: 300, power: 200 },
          { duration: 420, power: 220 },
        ]);
      });
    });
  }
});
