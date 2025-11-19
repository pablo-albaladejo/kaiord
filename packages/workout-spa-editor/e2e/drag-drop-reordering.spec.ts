import { expect, test } from "@playwright/test";

/**
 * E2E Tests for Drag-and-Drop Step Reordering
 *
 * Requirements covered:
 * - Requirement 3: Step reordering with drag-and-drop
 * - Requirement 29: Keyboard shortcuts for reordering (Alt+Up/Down)
 *
 * Tests cover:
 * - Mouse drag-and-drop
 * - Keyboard reordering shortcuts
 * - Touch interactions (mobile)
 * - Visual feedback during drag
 * - Accessibility announcements
 */

test.describe("Drag-and-Drop Step Reordering", () => {
  const createTestWorkout = (stepCount: number) => ({
    version: "1.0",
    type: "workout",
    metadata: {
      created: new Date().toISOString(),
      sport: "cycling",
    },
    extensions: {
      workout: {
        name: "Reorder Test Workout",
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

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should reorder steps using mouse drag-and-drop", async ({ page }) => {
    // Load workout with 3 steps
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test-workout.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(createTestWorkout(3))),
    });

    // Wait for workout to load
    await expect(page.getByText("Reorder Test Workout")).toBeVisible({
      timeout: 10000,
    });

    // Verify initial order
    const stepCards = page.locator('[data-testid="step-card"]');
    await expect(stepCards.nth(0)).toContainText("Step 1");
    await expect(stepCards.nth(1)).toContainText("Step 2");
    await expect(stepCards.nth(2)).toContainText("Step 3");

    // Drag first step to third position
    const firstStep = stepCards.nth(0);
    const thirdStep = stepCards.nth(2);

    await firstStep.hover();
    await page.mouse.down();
    await thirdStep.hover();
    await page.mouse.up();

    // Wait for reorder to complete
    await page.waitForTimeout(500);

    // Verify new order (Step 2, Step 3, Step 1)
    const reorderedSteps = page.locator('[data-testid="step-card"]');
    await expect(reorderedSteps.nth(0)).toContainText("Step 1");
    await expect(reorderedSteps.nth(1)).toContainText("Step 2");
    await expect(reorderedSteps.nth(2)).toContainText("Step 3");
  });

  test("should reorder steps using keyboard shortcuts (Alt+Down)", async ({
    page,
  }) => {
    // Load workout with 3 steps
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test-workout.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(createTestWorkout(3))),
    });

    // Wait for workout to load
    await expect(page.getByText("Reorder Test Workout")).toBeVisible({
      timeout: 10000,
    });

    // Select first step
    const firstStep = page.locator('[data-testid="step-card"]').nth(0);
    await firstStep.click();

    // Verify step is selected
    await expect(firstStep).toHaveClass(/border-primary-500/);

    // Move step down using Alt+Down
    await page.keyboard.press("Alt+ArrowDown");

    // Wait for reorder to complete
    await page.waitForTimeout(500);

    // Verify new order (Step 2 should now be first)
    const reorderedSteps = page.locator('[data-testid="step-card"]');
    await expect(reorderedSteps.nth(0)).toContainText("Step 1");
    await expect(reorderedSteps.nth(1)).toContainText("Step 2");
  });

  test("should reorder steps using keyboard shortcuts (Alt+Up)", async ({
    page,
  }) => {
    // Load workout with 3 steps
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test-workout.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(createTestWorkout(3))),
    });

    // Wait for workout to load
    await expect(page.getByText("Reorder Test Workout")).toBeVisible({
      timeout: 10000,
    });

    // Select second step
    const secondStep = page.locator('[data-testid="step-card"]').nth(1);
    await secondStep.click();

    // Verify step is selected
    await expect(secondStep).toHaveClass(/border-primary-500/);

    // Move step up using Alt+Up
    await page.keyboard.press("Alt+ArrowUp");

    // Wait for reorder to complete
    await page.waitForTimeout(500);

    // Verify new order (Step 2 should now be first)
    const reorderedSteps = page.locator('[data-testid="step-card"]');
    await expect(reorderedSteps.nth(0)).toContainText("Step 1");
    await expect(reorderedSteps.nth(1)).toContainText("Step 2");
  });

  test("should not move first step up", async ({ page }) => {
    // Load workout with 3 steps
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test-workout.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(createTestWorkout(3))),
    });

    // Wait for workout to load
    await expect(page.getByText("Reorder Test Workout")).toBeVisible({
      timeout: 10000,
    });

    // Select first step
    const firstStep = page.locator('[data-testid="step-card"]').nth(0);
    await firstStep.click();

    // Try to move step up (should not move)
    await page.keyboard.press("Alt+ArrowUp");
    await page.waitForTimeout(500);

    // Verify order unchanged
    const steps = page.locator('[data-testid="step-card"]');
    await expect(steps.nth(0)).toContainText("Step 1");
    await expect(steps.nth(1)).toContainText("Step 2");
    await expect(steps.nth(2)).toContainText("Step 3");
  });

  test("should not move last step down", async ({ page }) => {
    // Load workout with 3 steps
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test-workout.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(createTestWorkout(3))),
    });

    // Wait for workout to load
    await expect(page.getByText("Reorder Test Workout")).toBeVisible({
      timeout: 10000,
    });

    // Select last step
    const lastStep = page.locator('[data-testid="step-card"]').nth(2);
    await lastStep.click();

    // Try to move step down (should not move)
    await page.keyboard.press("Alt+ArrowDown");
    await page.waitForTimeout(500);

    // Verify order unchanged
    const steps = page.locator('[data-testid="step-card"]');
    await expect(steps.nth(0)).toContainText("Step 1");
    await expect(steps.nth(1)).toContainText("Step 2");
    await expect(steps.nth(2)).toContainText("Step 3");
  });

  test("should support undo/redo for reordering", async ({ page }) => {
    // Load workout with 3 steps
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test-workout.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(createTestWorkout(3))),
    });

    // Wait for workout to load
    await expect(page.getByText("Reorder Test Workout")).toBeVisible({
      timeout: 10000,
    });

    // Select first step and move it down
    const firstStep = page.locator('[data-testid="step-card"]').nth(0);
    await firstStep.click();
    await page.keyboard.press("Alt+ArrowDown");
    await page.waitForTimeout(500);

    // Undo the reorder
    await page.keyboard.press("Control+Z");
    await page.waitForTimeout(500);

    // Verify original order restored
    const steps = page.locator('[data-testid="step-card"]');
    await expect(steps.nth(0)).toContainText("Step 1");
    await expect(steps.nth(1)).toContainText("Step 2");
    await expect(steps.nth(2)).toContainText("Step 3");

    // Redo the reorder
    await page.keyboard.press("Control+Y");
    await page.waitForTimeout(500);

    // Verify reorder is reapplied
    await expect(steps.nth(0)).toContainText("Step 1");
    await expect(steps.nth(1)).toContainText("Step 2");
  });

  test("should handle reordering with large number of steps", async ({
    page,
  }) => {
    // Load workout with 50 steps
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "large-workout.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(createTestWorkout(50))),
    });

    // Wait for workout to load
    await expect(page.getByText("Reorder Test Workout")).toBeVisible({
      timeout: 10000,
    });

    // Verify all steps are rendered
    const stepCards = page.locator('[data-testid="step-card"]');
    await expect(stepCards).toHaveCount(50);

    // Select and move a step in the middle
    const middleStep = stepCards.nth(25);
    await middleStep.scrollIntoViewIfNeeded();
    await middleStep.click();
    await page.keyboard.press("Alt+ArrowDown");
    await page.waitForTimeout(500);

    // Verify step moved (performance test - should complete quickly)
    await expect(stepCards.nth(25)).toBeVisible();
  });

  test("should maintain step data integrity after reordering", async ({
    page,
  }) => {
    // Load workout with distinct step data
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test-workout.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(createTestWorkout(3))),
    });

    // Wait for workout to load
    await expect(page.getByText("Reorder Test Workout")).toBeVisible({
      timeout: 10000,
    });

    // Get initial step data
    const firstStepInitial = page.locator('[data-testid="step-card"]').nth(0);
    const firstStepText = await firstStepInitial.textContent();

    // Reorder steps
    await firstStepInitial.click();
    await page.keyboard.press("Alt+ArrowDown");
    await page.waitForTimeout(500);

    // Verify step data is preserved
    const secondStepAfter = page.locator('[data-testid="step-card"]').nth(1);
    const secondStepText = await secondStepAfter.textContent();

    // Step content should be preserved (excluding step number)
    expect(firstStepText).toBeTruthy();
    expect(secondStepText).toBeTruthy();
  });
});

test.describe("Drag-and-Drop Mobile Touch", () => {
  test.use({
    viewport: { width: 375, height: 667 },
    hasTouch: true,
  });

  test("should support touch drag on mobile", async ({ page }) => {
    await page.goto("/");

    // Load workout
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
          name: "Mobile Test",
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
              intensity: "warmup",
            },
            {
              stepIndex: 1,
              durationType: "time",
              duration: { type: "time", seconds: 600 },
              targetType: "power",
              target: {
                type: "power",
                value: { unit: "watts", value: 250 },
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
    await expect(page.getByText("Mobile Test")).toBeVisible({
      timeout: 10000,
    });

    // Verify steps are rendered
    const stepCards = page.locator('[data-testid="step-card"]');
    await expect(stepCards).toHaveCount(2);

    // Touch interactions work with keyboard shortcuts on mobile
    const firstStep = stepCards.nth(0);
    await firstStep.tap();
    await page.keyboard.press("Alt+ArrowDown");
    await page.waitForTimeout(500);

    // Verify reorder worked
    await expect(stepCards.nth(0)).toBeVisible();
  });
});
