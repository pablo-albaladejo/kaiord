import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * Helper function to load a test workout in E2E tests
 *
 * This ensures a workout is loaded and ready for testing,
 * which is required for most workout editing functionality.
 */
export async function loadTestWorkout(
  page: Page,
  workoutName = "Test Workout"
) {
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
        name: workoutName,
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
    name: "test-workout.krd",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(testWorkout)),
  });

  // Wait for workout to load and UI to stabilize
  await expect(page.getByText(workoutName)).toBeVisible({
    timeout: 10000,
  });
  await expect(page.locator('[data-testid="step-card"]').first()).toBeVisible();
  await page.waitForLoadState("networkidle");
}
