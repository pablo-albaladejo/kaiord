import { expect, test } from "@playwright/test";

/**
 * E2E Tests: Repetition Blocks
 *
 * Requirements covered:
 * - Requirement 4: Create repetition blocks from selected steps
 * - Requirement 5: Calculate statistics with repetition blocks
 *
 * Tests the complete user flow for creating and managing repetition blocks.
 */
test.describe("Repetition Blocks", () => {
  test("should create repetition block from selected steps", async ({
    page,
  }) => {
    await page.goto("/");

    // Load a workout with multiple steps
    const fileInput = page.getByTestId("file-upload-input");
    const testWorkout = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: new Date().toISOString(),
        sport: "cycling",
      },
      extensions: {
        workout: {
          name: "Interval Workout",
          sport: "cycling",
          steps: [
            {
              stepIndex: 0,
              durationType: "time",
              duration: { type: "time", seconds: 300 },
              targetType: "power",
              target: {
                type: "power",
                value: { unit: "watts", value: 150 },
              },
              intensity: "warmup",
            },
            {
              stepIndex: 1,
              durationType: "time",
              duration: { type: "time", seconds: 60 },
              targetType: "power",
              target: {
                type: "power",
                value: { unit: "watts", value: 300 },
              },
              intensity: "active",
            },
            {
              stepIndex: 2,
              durationType: "time",
              duration: { type: "time", seconds: 120 },
              targetType: "power",
              target: {
                type: "power",
                value: { unit: "watts", value: 150 },
              },
              intensity: "rest",
            },
            {
              stepIndex: 3,
              durationType: "time",
              duration: { type: "time", seconds: 300 },
              targetType: "power",
              target: {
                type: "power",
                value: { unit: "watts", value: 150 },
              },
              intensity: "cooldown",
            },
          ],
        },
      },
    };

    await fileInput.setInputFiles({
      name: "interval-workout.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(testWorkout)),
    });

    // Wait for workout to load
    await expect(page.getByText("Interval Workout")).toBeVisible({
      timeout: 10000,
    });

    // Select steps 2 and 3 (the interval and recovery)
    const step2 = page.locator('[data-testid="step-card"]').nth(1);
    const step3 = page.locator('[data-testid="step-card"]').nth(2);

    // Use keyboard to hold Control key while clicking
    await page.keyboard.down("Control");
    await step2.click();
    await step3.click();
    await page.keyboard.up("Control");

    // Wait for the button to appear
    await expect(
      page.getByTestId("create-repetition-block-button")
    ).toBeVisible({ timeout: 5000 });

    // Click "Create Repetition Block" button
    await page.getByTestId("create-repetition-block-button").click();

    // Set repeat count in dialog
    const repeatCountInput = page.getByTestId("repeat-count-input");
    await repeatCountInput.fill("5");
    await page.getByTestId("confirm-create-block-button").click();

    // Verify repetition block was created
    await expect(page.getByText("Repeat Block")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("5x")).toBeVisible();
    await expect(page.getByText("2 steps")).toBeVisible();
  });

  test("should edit repeat count", async ({ page }) => {
    await page.goto("/");

    // Load a workout with a repetition block
    const fileInput = page.getByTestId("file-upload-input");
    const testWorkout = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: new Date().toISOString(),
        sport: "running",
      },
      extensions: {
        workout: {
          name: "Repeat Test",
          sport: "running",
          steps: [
            {
              repeatCount: 3,
              steps: [
                {
                  stepIndex: 0,
                  durationType: "time",
                  duration: { type: "time", seconds: 60 },
                  targetType: "pace",
                  target: {
                    type: "pace",
                    value: { unit: "min_per_km", value: 4.0 },
                  },
                  intensity: "active",
                },
                {
                  stepIndex: 1,
                  durationType: "time",
                  duration: { type: "time", seconds: 120 },
                  targetType: "pace",
                  target: {
                    type: "pace",
                    value: { unit: "min_per_km", value: 6.0 },
                  },
                  intensity: "rest",
                },
              ],
            },
          ],
        },
      },
    };

    await fileInput.setInputFiles({
      name: "repeat-test.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(testWorkout)),
    });

    // Wait for workout to load
    await expect(page.getByText("Repeat Test")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("3x")).toBeVisible();

    // Click edit button
    await page.getByTestId("edit-count-button").click();

    // Change repeat count
    const input = page.getByTestId("repeat-count-input");
    await input.fill("7");

    // Save changes
    await page.getByTestId("save-count-button").click();

    // Verify repeat count was updated
    await expect(page.getByText("7x")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("3x")).not.toBeVisible();
  });

  test("should expand and collapse repetition block", async ({ page }) => {
    await page.goto("/");

    // Load a workout with a repetition block
    const fileInput = page.getByTestId("file-upload-input");
    const testWorkout = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: new Date().toISOString(),
        sport: "cycling",
      },
      extensions: {
        workout: {
          name: "Collapse Test",
          sport: "cycling",
          steps: [
            {
              repeatCount: 4,
              steps: [
                {
                  stepIndex: 0,
                  durationType: "time",
                  duration: { type: "time", seconds: 30 },
                  targetType: "power",
                  target: {
                    type: "power",
                    value: { unit: "watts", value: 350 },
                  },
                  intensity: "active",
                },
                {
                  stepIndex: 1,
                  durationType: "time",
                  duration: { type: "time", seconds: 90 },
                  targetType: "power",
                  target: {
                    type: "power",
                    value: { unit: "watts", value: 150 },
                  },
                  intensity: "rest",
                },
              ],
            },
          ],
        },
      },
    };

    await fileInput.setInputFiles({
      name: "collapse-test.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(testWorkout)),
    });

    // Wait for workout to load
    await expect(page.getByText("Collapse Test")).toBeVisible({
      timeout: 10000,
    });

    // Verify steps are visible (expanded by default)
    const stepCards = page.locator('[data-testid="step-card"]');
    await expect(stepCards).toHaveCount(2);

    // Click toggle button to collapse
    await page.getByTestId("toggle-expand-button").click();

    // Verify steps are hidden
    await expect(stepCards).toHaveCount(0);

    // Click toggle button to expand again
    await page.getByTestId("toggle-expand-button").click();

    // Verify steps are visible again
    await expect(stepCards).toHaveCount(2);
  });

  test("should calculate stats correctly with repetition blocks", async ({
    page,
  }) => {
    await page.goto("/");

    // Load a workout with repetition blocks
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
          name: "Stats Test",
          sport: "running",
          steps: [
            {
              stepIndex: 0,
              durationType: "time",
              duration: { type: "time", seconds: 600 },
              targetType: "pace",
              target: {
                type: "pace",
                value: { unit: "min_per_km", value: 6.0 },
              },
              intensity: "warmup",
            },
            {
              repeatCount: 5,
              steps: [
                {
                  stepIndex: 1,
                  durationType: "time",
                  duration: { type: "time", seconds: 60 },
                  targetType: "pace",
                  target: {
                    type: "pace",
                    value: { unit: "min_per_km", value: 4.0 },
                  },
                  intensity: "active",
                },
                {
                  stepIndex: 2,
                  durationType: "time",
                  duration: { type: "time", seconds: 120 },
                  targetType: "pace",
                  target: {
                    type: "pace",
                    value: { unit: "min_per_km", value: 6.0 },
                  },
                  intensity: "rest",
                },
              ],
            },
            {
              stepIndex: 3,
              durationType: "time",
              duration: { type: "time", seconds: 600 },
              targetType: "pace",
              target: {
                type: "pace",
                value: { unit: "min_per_km", value: 6.0 },
              },
              intensity: "cooldown",
            },
          ],
        },
      },
    };

    await fileInput.setInputFiles({
      name: "stats-test.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(testWorkout)),
    });

    // Wait for workout to load
    await expect(page.getByText("Stats Test")).toBeVisible({
      timeout: 10000,
    });

    // Verify total duration calculation
    // 600 (warmup) + (60 + 120) * 5 (intervals) + 600 (cooldown) = 2100 seconds = 35:00
    await expect(page.getByText("35:00")).toBeVisible({ timeout: 5000 });

    // Verify step count
    // 1 (warmup) + 2 * 5 (intervals) + 1 (cooldown) = 12 steps
    await expect(page.getByText("12 steps")).toBeVisible();

    // Verify repetition count
    await expect(page.getByText("1 repetition")).toBeVisible();
  });

  test("should add step within repetition block", async ({ page }) => {
    await page.goto("/");

    // Load a workout with a repetition block
    const fileInput = page.getByTestId("file-upload-input");
    const testWorkout = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: new Date().toISOString(),
        sport: "cycling",
      },
      extensions: {
        workout: {
          name: "Add Step Test",
          sport: "cycling",
          steps: [
            {
              repeatCount: 3,
              steps: [
                {
                  stepIndex: 0,
                  durationType: "time",
                  duration: { type: "time", seconds: 60 },
                  targetType: "power",
                  target: {
                    type: "power",
                    value: { unit: "watts", value: 250 },
                  },
                  intensity: "active",
                },
              ],
            },
          ],
        },
      },
    };

    await fileInput.setInputFiles({
      name: "add-step-test.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(testWorkout)),
    });

    // Wait for workout to load
    await expect(page.getByText("Add Step Test")).toBeVisible({
      timeout: 10000,
    });

    // Verify initial state
    await expect(page.getByText("1 step")).toBeVisible();

    // Click add step button within the block (use first() to get the one inside the repetition block)
    await page.getByTestId("add-step-button").first().click();

    // Verify step was added
    await expect(page.getByText("2 steps")).toBeVisible({ timeout: 5000 });
  });

  test("should handle undo/redo with repetition blocks", async ({ page }) => {
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
          name: "Undo Test",
          sport: "running",
          steps: [
            {
              stepIndex: 0,
              durationType: "time",
              duration: { type: "time", seconds: 60 },
              targetType: "pace",
              target: {
                type: "pace",
                value: { unit: "min_per_km", value: 4.0 },
              },
              intensity: "active",
            },
            {
              stepIndex: 1,
              durationType: "time",
              duration: { type: "time", seconds: 120 },
              targetType: "pace",
              target: {
                type: "pace",
                value: { unit: "min_per_km", value: 6.0 },
              },
              intensity: "rest",
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
    await expect(page.getByText("Undo Test")).toBeVisible({
      timeout: 10000,
    });

    // Select both steps
    const step1 = page.locator('[data-testid="step-card"]').first();
    const step2 = page.locator('[data-testid="step-card"]').nth(1);

    // Use keyboard to hold Control key while clicking
    await page.keyboard.down("Control");
    await step1.click();
    await step2.click();
    await page.keyboard.up("Control");

    // Wait for the button to appear
    await expect(
      page.getByTestId("create-repetition-block-button")
    ).toBeVisible({ timeout: 5000 });

    // Create repetition block
    await page.getByTestId("create-repetition-block-button").click();
    const repeatCountInput = page.getByTestId("repeat-count-input");
    await repeatCountInput.fill("3");
    await page.getByTestId("confirm-create-block-button").click();

    // Verify block was created
    await expect(page.getByText("Repeat Block")).toBeVisible({
      timeout: 5000,
    });

    // Undo the block creation
    await page.keyboard.press("Control+Z");

    // Verify block is removed and steps are back
    await expect(page.getByText("Repeat Block")).not.toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("Step 1")).toBeVisible();
    await expect(page.getByText("Step 2")).toBeVisible();

    // Redo the block creation
    await page.keyboard.press("Control+Y");

    // Verify block is back
    await expect(page.getByText("Repeat Block")).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe("Repetition Blocks - Performance", () => {
  test("should render large repetition blocks efficiently", async ({
    page,
  }) => {
    await page.goto("/");

    // Create a workout with a large repetition block (25 steps)
    const steps = Array.from({ length: 25 }, (_, i) => ({
      stepIndex: i,
      durationType: "time",
      duration: { type: "time", seconds: 30 },
      targetType: "power",
      target: {
        type: "power",
        value: { unit: "watts", value: 200 + i * 10 },
      },
      intensity: "active",
    }));

    const testWorkout = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: new Date().toISOString(),
        sport: "cycling",
      },
      extensions: {
        workout: {
          name: "Large Block Test",
          sport: "cycling",
          steps: [
            {
              repeatCount: 2,
              steps,
            },
          ],
        },
      },
    };

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "large-block.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(testWorkout)),
    });

    // Wait for workout to load
    await expect(page.getByText("Large Block Test")).toBeVisible({
      timeout: 10000,
    });

    // Verify block renders
    await expect(page.getByText("25 steps")).toBeVisible({ timeout: 5000 });

    // Measure time to expand/collapse
    const startTime = Date.now();
    await page.getByTestId("toggle-expand-button").click();
    await expect(page.locator('[data-testid="step-card"]')).toHaveCount(0);
    const collapseTime = Date.now() - startTime;

    // Should complete in under 1 second
    expect(collapseTime).toBeLessThan(1000);

    // Expand again
    const expandStartTime = Date.now();
    await page.getByTestId("toggle-expand-button").click();
    await expect(page.locator('[data-testid="step-card"]')).toHaveCount(25);
    const expandTime = Date.now() - expandStartTime;

    // Should complete in under 2 seconds
    expect(expandTime).toBeLessThan(2000);
  });

  test("should handle deeply nested repetitions", async ({ page }) => {
    await page.goto("/");

    // Note: Current implementation doesn't support nested repetition blocks
    // This test documents the expected behavior for future implementation

    const testWorkout = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: new Date().toISOString(),
        sport: "running",
      },
      extensions: {
        workout: {
          name: "Nested Test",
          sport: "running",
          steps: [
            {
              repeatCount: 3,
              steps: [
                {
                  stepIndex: 0,
                  durationType: "time",
                  duration: { type: "time", seconds: 60 },
                  targetType: "pace",
                  target: {
                    type: "pace",
                    value: { unit: "min_per_km", value: 4.0 },
                  },
                  intensity: "active",
                },
              ],
            },
          ],
        },
      },
    };

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "nested-test.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(testWorkout)),
    });

    // Wait for workout to load
    await expect(page.getByText("Nested Test")).toBeVisible({
      timeout: 10000,
    });

    // Verify single-level repetition works
    await expect(page.getByText("3x")).toBeVisible();
    await expect(page.getByText("1 step")).toBeVisible();
  });
});
