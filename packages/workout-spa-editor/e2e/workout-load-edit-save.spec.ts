import { expect, test } from "./fixtures/base";
import { readFileSync } from "fs";

/**
 * Critical Path: Load Workout → View → Edit Step → Save
 *
 * Requirements covered:
 * - Requirement 7: Load existing KRD file
 * - Requirement 1: View workout structure
 * - Requirement 3: Edit existing workout steps
 * - Requirement 6: Save workout as KRD file
 */
test.describe("Workout Load, Edit, and Save Flow", () => {
  test("should load a workout file, edit a step, and save changes", async ({
    page,
  }) => {
    // Navigate to the application
    await page.goto("/");

    // Wait for the welcome section to load (use heading with level to avoid strict mode)
    await expect(
      page.getByRole("heading", { name: "Workout Editor", level: 1 })
    ).toBeVisible();

    // Load a workout file
    const fileInput = page.locator('input[type="file"]');

    // Create a minimal valid KRD workout
    const testWorkout = {
      version: "1.0",
      type: "structured_workout",
      metadata: {
        created: new Date().toISOString(),
        sport: "cycling",
      },
      extensions: {
        structured_workout: {
          name: "Test Workout",
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

    // Upload the file
    await fileInput.setInputFiles({
      name: "test-workout.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(testWorkout)),
    });

    // Verify workout is loaded and displayed
    await expect(page.getByText("Test Workout")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("Step 1")).toBeVisible();
    await expect(page.getByText("Step 2")).toBeVisible();

    // Verify step details are shown
    await expect(page.getByText("5:00")).toBeVisible(); // 300 seconds
    await expect(page.getByText("200W")).toBeVisible(); // No space in format

    // Click on the first step card to edit it
    const firstStepCard = page.locator('[data-testid="step-card"]').first();
    await firstStepCard.click();

    // Wait for the step editor to open
    await expect(page.getByText("Edit Step")).toBeVisible({ timeout: 5000 });

    // Change the duration from 300 to 420 seconds (7 minutes)
    const durationInput = page.getByLabel("Duration (seconds)");
    await durationInput.clear();
    await durationInput.fill("420");

    // Change the power from 200 to 220 watts
    const powerInput = page.getByLabel("Power (watts)");
    await powerInput.clear();
    await powerInput.fill("220");

    // Save the changes (use exact match to avoid ambiguity)
    await page.getByRole("button", { name: "Save step changes" }).click();

    // Verify the step editor closes
    await expect(page.getByText("Edit Step")).not.toBeVisible({
      timeout: 5000,
    });

    // Verify the updated values are displayed
    await expect(page.getByText("7:00")).toBeVisible(); // 420 seconds
    await expect(page.getByText("220W")).toBeVisible(); // No space in format

    // Save the workout
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /save workout/i }).click();
    const download = await downloadPromise;

    // Verify the download
    expect(download.suggestedFilename()).toMatch(/\.krd$/);

    // Verify the downloaded content
    const downloadPath = await download.path();
    if (downloadPath) {
      const content = readFileSync(downloadPath, "utf-8");
      const savedWorkout = JSON.parse(content);

      expect(
        savedWorkout.extensions.structured_workout.steps[0].duration.seconds
      ).toBe(420);
      expect(
        savedWorkout.extensions.structured_workout.steps[0].target.value.value
      ).toBe(220);
    }
  });

  test("should validate KRD file and show errors for invalid format", async ({
    page,
  }) => {
    await page.goto("/");

    const fileInput = page.locator('input[type="file"]');

    // Upload an invalid KRD file (missing required fields)
    const invalidWorkout = {
      version: "1.0",
      // Missing 'type' field
      metadata: {
        created: new Date().toISOString(),
      },
    };

    await fileInput.setInputFiles({
      name: "invalid-workout.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(invalidWorkout)),
    });

    // Verify error message is displayed
    await expect(page.getByText(/validation error/i)).toBeVisible();
    // Use first() to avoid strict mode violation (multiple "required" messages)
    await expect(page.getByText(/required/i).first()).toBeVisible();
  });

  test("should handle file parsing errors gracefully", async ({ page }) => {
    await page.goto("/");

    const fileInput = page.getByTestId("file-upload-input");

    // Upload a file with invalid JSON
    await fileInput.setInputFiles({
      name: "corrupted.krd",
      mimeType: "application/json",
      buffer: Buffer.from("{ invalid json }"),
    });

    // Verify error message is displayed (use specific text from error handler)
    await expect(
      page.getByText(/invalid file format|import failed/i)
    ).toBeVisible();
    await expect(
      page.getByText(/failed to parse json|invalid json/i)
    ).toBeVisible();
  });
});
