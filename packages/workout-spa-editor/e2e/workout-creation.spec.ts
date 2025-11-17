import { expect, test } from "@playwright/test";

/**
 * Critical Path: Step Management (Create, Delete, Duplicate)
 *
 * Requirements covered:
 * - Requirement 2: Create new workout steps
 * - Requirement 5: Delete workout steps
 * - Requirement 16: Duplicate workout steps
 * - Requirement 15: Undo/redo functionality
 *
 * Note: Full workout creation UI is not yet implemented.
 * These tests focus on step management within a loaded workout.
 */
test.describe("Step Management Flow", () => {
  test("should create, duplicate, and delete steps", async ({ page }) => {
    await page.goto("/");

    // Load a minimal workout file
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
          name: "Step Management Test",
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
          ],
        },
      },
    };

    await fileInput.setInputFiles({
      name: "test-workout.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(testWorkout)),
    });

    // Verify workout is loaded
    await expect(page.getByText("Step Management Test")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("Step 1")).toBeVisible();

    // Test: Create a new step
    await page.getByTestId("add-step-button").click();

    // Verify a new step was added (should be Step 2)
    await expect(page.getByText("Step 2")).toBeVisible({ timeout: 5000 });

    // Test: Duplicate the first step
    const firstStepCard = page.locator('[data-testid="step-card"]').first();
    const duplicateButton = firstStepCard.getByTestId("duplicate-step-button");
    await duplicateButton.click();

    // Verify step was duplicated (should now have 3 steps)
    await expect(page.getByText("Step 3")).toBeVisible({ timeout: 5000 });

    // Test: Delete the second step
    const secondStepCard = page.locator('[data-testid="step-card"]').nth(1);
    const deleteButton = secondStepCard.getByTestId("delete-step-button");
    await deleteButton.click();

    // Confirm deletion in dialog
    await page.getByTestId("confirm-delete-button").click();

    // Verify step was deleted (should only have 2 steps now)
    await expect(page.getByText("Step 2")).toBeVisible();
    await expect(page.getByText("Step 3")).not.toBeVisible();
  });

  test("should support undo/redo for step operations", async ({ page }) => {
    await page.goto("/");

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
          name: "Undo Test",
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
          ],
        },
      },
    };

    await fileInput.setInputFiles({
      name: "undo-test.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(testWorkout)),
    });

    // Wait for workout to load
    await expect(page.getByText("Undo Test")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Step 1")).toBeVisible();

    // Add a step
    await page.getByTestId("add-step-button").click();
    await expect(page.getByText("Step 2")).toBeVisible({ timeout: 5000 });

    // Undo the step addition
    await page.keyboard.press("Control+Z");

    // Verify step is removed
    await expect(page.getByText("Step 2")).not.toBeVisible({ timeout: 5000 });

    // Redo the step addition
    await page.keyboard.press("Control+Y");

    // Verify step is back
    await expect(page.getByText("Step 2")).toBeVisible({ timeout: 5000 });
  });

  test("should save workout with keyboard shortcut", async ({ page }) => {
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
          name: "Keyboard Test",
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
      name: "keyboard-test.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(testWorkout)),
    });

    // Wait for workout to load
    await expect(page.getByText("Keyboard Test")).toBeVisible({
      timeout: 10000,
    });

    // Test Ctrl+S (save) - should trigger download
    const downloadPromise = page.waitForEvent("download");
    await page.keyboard.press("Control+S");
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.krd$/);
  });
});
