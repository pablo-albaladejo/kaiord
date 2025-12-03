import { expect, test } from "./fixtures/base";

/**
 * E2E Tests: Step Selection with Unique IDs
 *
 * Requirements covered:
 * - Requirement 4.1: Test selecting main workout step
 * - Requirement 4.2: Test selecting step in repetition block
 * - Requirement 4.3: Test multi-selection across blocks
 * - Requirement 4.4: Verify visual selection indicators
 *
 * Tests the complete user flow for step selection with unique hierarchical IDs
 * to ensure steps with the same stepIndex in different contexts are independently selectable.
 */
test.describe("Step Selection - Unique IDs", () => {
  test("should select only the clicked step in main workout", async ({
    page,
  }) => {
    // Requirement 4.1: Test selecting main workout step
    await page.goto("/");

    // Load a workout with steps that have duplicate stepIndex values
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
          name: "Selection Test",
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
              repeatCount: 3,
              steps: [
                {
                  stepIndex: 0,
                  durationType: "time",
                  duration: { type: "time", seconds: 120 },
                  targetType: "power",
                  target: {
                    type: "power",
                    value: { unit: "watts", value: 250 },
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
      name: "selection-test.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(testWorkout)),
    });

    // Wait for workout to load
    await expect(page.getByText("Selection Test")).toBeVisible({
      timeout: 10000,
    });

    // Get all step cards (2 in main workout + 2 in block = 4 total)
    const allStepCards = page.locator('[data-testid="step-card"]');
    await expect(allStepCards).toHaveCount(4, { timeout: 5000 });

    // Click on the first step in main workout (stepIndex: 0)
    const mainWorkoutStep1 = allStepCards.nth(0);
    await mainWorkoutStep1.click();

    // Verify only the clicked step is selected
    await expect(mainWorkoutStep1).toHaveAttribute("data-selected", "true", {
      timeout: 2000,
    });

    // Verify other steps with same stepIndex (in block) are NOT selected
    const blockStep1 = allStepCards.nth(2); // First step in block (also stepIndex: 0)
    await expect(blockStep1).toHaveAttribute("data-selected", "false");

    // Verify visual selection indicator appears only on selected step
    const selectedIndicators = page.locator(
      '[data-testid="step-card"][data-selected="true"]'
    );
    await expect(selectedIndicators).toHaveCount(1);
  });

  test("should select only the clicked step inside repetition block", async ({
    page,
  }) => {
    // Requirement 4.2: Test selecting step in repetition block
    await page.goto("/");

    // Load a workout with repetition blocks
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
          name: "Block Selection Test",
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
              repeatCount: 4,
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
      name: "block-selection-test.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(testWorkout)),
    });

    // Wait for workout to load
    await expect(page.getByText("Block Selection Test")).toBeVisible({
      timeout: 10000,
    });

    // Get all step cards
    const allStepCards = page.locator('[data-testid="step-card"]');
    await expect(allStepCards).toHaveCount(3, { timeout: 5000 });

    // Click on the first step inside the repetition block (stepIndex: 0)
    const blockStep1 = allStepCards.nth(1);
    await blockStep1.click();

    // Verify only the clicked step is selected
    await expect(blockStep1).toHaveAttribute("data-selected", "true", {
      timeout: 2000,
    });

    // Verify the main workout step with same stepIndex is NOT selected
    const mainWorkoutStep1 = allStepCards.nth(0);
    await expect(mainWorkoutStep1).toHaveAttribute("data-selected", "false");

    // Verify visual selection indicator appears only on selected step
    const selectedIndicators = page.locator(
      '[data-testid="step-card"][data-selected="true"]'
    );
    await expect(selectedIndicators).toHaveCount(1);
  });

  test("should support multi-selection across different blocks", async ({
    page,
  }) => {
    // Requirement 4.3: Test multi-selection across blocks
    await page.goto("/");

    // Load a workout with multiple repetition blocks
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
          name: "Multi-Selection Test",
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
              repeatCount: 2,
              steps: [
                {
                  stepIndex: 0,
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
            {
              repeatCount: 3,
              steps: [
                {
                  stepIndex: 0,
                  durationType: "time",
                  duration: { type: "time", seconds: 120 },
                  targetType: "power",
                  target: {
                    type: "power",
                    value: { unit: "watts", value: 250 },
                  },
                  intensity: "active",
                },
                {
                  stepIndex: 1,
                  durationType: "time",
                  duration: { type: "time", seconds: 60 },
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
      name: "multi-selection-test.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(testWorkout)),
    });

    // Wait for workout to load
    await expect(page.getByText("Multi-Selection Test")).toBeVisible({
      timeout: 10000,
    });

    // Get all step cards (1 main + 2 in block1 + 2 in block2 = 5 total)
    const allStepCards = page.locator('[data-testid="step-card"]');
    await expect(allStepCards).toHaveCount(5, { timeout: 5000 });

    // Multi-select: main workout step + step from first block + step from second block
    const mainStep = allStepCards.nth(0);
    const block1Step = allStepCards.nth(1);
    const block2Step = allStepCards.nth(3);

    // Use evaluate to dispatch click events with Control modifier for cross-browser compatibility
    await mainStep.evaluate((el) => {
      const event = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        ctrlKey: true,
        metaKey: false,
      });
      el.dispatchEvent(event);
    });
    await page.waitForTimeout(150);

    await block1Step.evaluate((el) => {
      const event = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        ctrlKey: true,
        metaKey: false,
      });
      el.dispatchEvent(event);
    });
    await page.waitForTimeout(150);

    await block2Step.evaluate((el) => {
      const event = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        ctrlKey: true,
        metaKey: false,
      });
      el.dispatchEvent(event);
    });
    await page.waitForTimeout(300);

    // Verify all three clicked steps are selected
    await expect(mainStep).toHaveAttribute("data-selected", "true", {
      timeout: 2000,
    });
    await expect(block1Step).toHaveAttribute("data-selected", "true");
    await expect(block2Step).toHaveAttribute("data-selected", "true");

    // Verify other steps are NOT selected
    const block1Step2 = allStepCards.nth(2);
    const block2Step2 = allStepCards.nth(4);
    await expect(block1Step2).toHaveAttribute("data-selected", "false");
    await expect(block2Step2).toHaveAttribute("data-selected", "false");

    // Verify exactly 3 steps are selected
    const selectedIndicators = page.locator(
      '[data-testid="step-card"][data-selected="true"]'
    );
    await expect(selectedIndicators).toHaveCount(3);
  });

  test("should independently select steps with same stepIndex in different contexts", async ({
    page,
  }) => {
    // Requirement 4.4: Verify steps with same stepIndex are independently selectable
    await page.goto("/");

    // Load a workout where multiple contexts have steps with stepIndex: 1
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
          name: "Independent Selection Test",
          sport: "running",
          steps: [
            {
              stepIndex: 0,
              durationType: "time",
              duration: { type: "time", seconds: 300 },
              targetType: "pace",
              target: {
                type: "pace",
                value: { unit: "min_per_km", value: 6.0 },
              },
              intensity: "warmup",
            },
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
              repeatCount: 2,
              steps: [
                {
                  stepIndex: 0,
                  durationType: "time",
                  duration: { type: "time", seconds: 90 },
                  targetType: "pace",
                  target: {
                    type: "pace",
                    value: { unit: "min_per_km", value: 5.0 },
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
            {
              repeatCount: 3,
              steps: [
                {
                  stepIndex: 1,
                  durationType: "time",
                  duration: { type: "time", seconds: 45 },
                  targetType: "pace",
                  target: {
                    type: "pace",
                    value: { unit: "min_per_km", value: 3.5 },
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
      name: "independent-selection-test.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(testWorkout)),
    });

    // Wait for workout to load
    await expect(page.getByText("Independent Selection Test")).toBeVisible({
      timeout: 10000,
    });

    // Get all step cards
    const allStepCards = page.locator('[data-testid="step-card"]');
    await expect(allStepCards).toHaveCount(5, { timeout: 5000 });

    // Click on main workout step with stepIndex: 1 (second step)
    const mainStepIndex1 = allStepCards.nth(1);
    await mainStepIndex1.click();

    // Verify only this step is selected
    await expect(mainStepIndex1).toHaveAttribute("data-selected", "true", {
      timeout: 2000,
    });

    // Verify other steps with stepIndex: 1 in different contexts are NOT selected
    const block1StepIndex1 = allStepCards.nth(3); // Second step in first block
    const block2StepIndex1 = allStepCards.nth(4); // First step in second block
    await expect(block1StepIndex1).toHaveAttribute("data-selected", "false");
    await expect(block2StepIndex1).toHaveAttribute("data-selected", "false");

    // Now click on block1's step with stepIndex: 1
    await block1StepIndex1.click();

    // Verify only this step is now selected
    await expect(block1StepIndex1).toHaveAttribute("data-selected", "true", {
      timeout: 2000,
    });
    await expect(mainStepIndex1).toHaveAttribute("data-selected", "false");
    await expect(block2StepIndex1).toHaveAttribute("data-selected", "false");

    // Verify exactly 1 step is selected
    const selectedIndicators = page.locator(
      '[data-testid="step-card"][data-selected="true"]'
    );
    await expect(selectedIndicators).toHaveCount(1);
  });

  test("should maintain selection state across different contexts", async ({
    page,
  }) => {
    // Requirement 4.4: Verify selection behavior with duplicate stepIndex values
    await page.goto("/");

    // Load a workout with multiple blocks and duplicate stepIndex values
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
          name: "Selection State Test",
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
              repeatCount: 2,
              steps: [
                {
                  stepIndex: 0,
                  durationType: "time",
                  duration: { type: "time", seconds: 90 },
                  targetType: "power",
                  target: {
                    type: "power",
                    value: { unit: "watts", value: 250 },
                  },
                  intensity: "active",
                },
                {
                  stepIndex: 1,
                  durationType: "time",
                  duration: { type: "time", seconds: 120 },
                  targetType: "power",
                  target: {
                    type: "power",
                    value: { unit: "watts", value: 150 },
                  },
                  intensity: "rest",
                },
              ],
            },
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
                    value: { unit: "watts", value: 350 },
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
      name: "selection-state-test.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(testWorkout)),
    });

    // Wait for workout to load
    await expect(page.getByText("Selection State Test")).toBeVisible({
      timeout: 10000,
    });

    // Get all step cards
    const allStepCards = page.locator('[data-testid="step-card"]');
    await expect(allStepCards).toHaveCount(5, { timeout: 5000 });

    // Test: Select main workout step with stepIndex 0
    const mainStep0 = allStepCards.nth(0);
    await mainStep0.click();
    await expect(mainStep0).toHaveAttribute("data-selected", "true", {
      timeout: 2000,
    });

    // Verify block steps with same stepIndex are NOT selected
    const block1Step0 = allStepCards.nth(2);
    const block2Step0 = allStepCards.nth(4);
    await expect(block1Step0).toHaveAttribute("data-selected", "false");
    await expect(block2Step0).toHaveAttribute("data-selected", "false");

    // Test: Select a different step (main workout step 1)
    const mainStep1 = allStepCards.nth(1);
    await mainStep1.click();
    await expect(mainStep1).toHaveAttribute("data-selected", "true", {
      timeout: 2000,
    });

    // Verify previous selection is cleared
    await expect(mainStep0).toHaveAttribute("data-selected", "false");

    // Verify block step with same stepIndex is NOT selected
    const block1Step1 = allStepCards.nth(3);
    await expect(block1Step1).toHaveAttribute("data-selected", "false");

    // Verify only one step is selected at a time
    const selectedIndicators = page.locator(
      '[data-testid="step-card"][data-selected="true"]'
    );
    await expect(selectedIndicators).toHaveCount(1);
  });
});
