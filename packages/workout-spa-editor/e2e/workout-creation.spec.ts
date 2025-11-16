import { expect, test } from "@playwright/test";

/**
 * Critical Path: Create New Workout → Add Steps → Save
 *
 * Requirements covered:
 * - Requirement 2: Create new workout from scratch
 * - Requirement 3: Configure workout steps
 * - Requirement 6: Save workout as KRD file
 * - Requirement 9: View workout statistics
 */
test.describe("Workout Creation Flow", () => {
  test("should create a new workout with multiple steps", async ({ page }) => {
    await page.goto("/");

    // Click "Create New Workout" button
    await page.getByRole("button", { name: /create new workout/i }).click();

    // Fill in workout metadata
    await page.getByLabel(/workout name/i).fill("My First Workout");

    // Select sport
    await page.getByLabel(/sport/i).click();
    await page.getByRole("option", { name: /cycling/i }).click();

    // Confirm workout creation
    await page.getByRole("button", { name: /create/i }).click();

    // Verify workout is created and displayed
    await expect(page.getByText("My First Workout")).toBeVisible();

    // Add first step (warmup)
    await page.getByRole("button", { name: /add step/i }).click();

    // Configure step duration
    await page.getByLabel(/duration type/i).click();
    await page.getByRole("option", { name: /time/i }).click();
    await page.getByLabel(/duration value/i).fill("300"); // 5 minutes

    // Configure step target
    await page.getByLabel(/target type/i).click();
    await page.getByRole("option", { name: /power/i }).click();
    await page.getByLabel(/target value/i).fill("150");

    // Set intensity
    await page.getByLabel(/intensity/i).click();
    await page.getByRole("option", { name: /warmup/i }).click();

    // Save step
    await page.getByRole("button", { name: /save step/i }).click();

    // Verify step is added
    await expect(page.getByText("Step 1")).toBeVisible();
    await expect(page.getByText("5:00")).toBeVisible();
    await expect(page.getByText("150 W")).toBeVisible();

    // Add second step (main interval)
    await page.getByRole("button", { name: /add step/i }).click();

    await page.getByLabel(/duration type/i).click();
    await page.getByRole("option", { name: /time/i }).click();
    await page.getByLabel(/duration value/i).fill("1200"); // 20 minutes

    await page.getByLabel(/target type/i).click();
    await page.getByRole("option", { name: /power/i }).click();
    await page.getByLabel(/target value/i).fill("250");

    await page.getByLabel(/intensity/i).click();
    await page.getByRole("option", { name: /active/i }).click();

    await page.getByRole("button", { name: /save step/i }).click();

    // Verify second step is added
    await expect(page.getByText("Step 2")).toBeVisible();
    await expect(page.getByText("20:00")).toBeVisible();
    await expect(page.getByText("250 W")).toBeVisible();

    // Verify workout statistics are updated
    await expect(page.getByText(/total duration/i)).toBeVisible();
    await expect(page.getByText("25:00")).toBeVisible(); // 5 + 20 minutes

    // Save the workout
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /save workout/i }).click();
    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toBe("my-first-workout.krd");
  });

  test("should validate step inputs and show errors", async ({ page }) => {
    await page.goto("/");

    // Create a new workout
    await page.getByRole("button", { name: /create new workout/i }).click();
    await page.getByLabel(/workout name/i).fill("Test Validation");
    await page.getByLabel(/sport/i).click();
    await page.getByRole("option", { name: /running/i }).click();
    await page.getByRole("button", { name: /create/i }).click();

    // Add a step with invalid data
    await page.getByRole("button", { name: /add step/i }).click();

    // Try to save without filling required fields
    await page.getByRole("button", { name: /save step/i }).click();

    // Verify validation errors are shown
    await expect(page.getByText(/required/i)).toBeVisible();

    // Fill in negative duration (invalid)
    await page.getByLabel(/duration value/i).fill("-100");

    // Verify error message
    await expect(page.getByText(/positive/i)).toBeVisible();

    // Fill in valid duration
    await page.getByLabel(/duration value/i).fill("600");

    // Fill in power zone outside valid range (1-7)
    await page.getByLabel(/target type/i).click();
    await page.getByRole("option", { name: /power/i }).click();
    await page.getByLabel(/unit/i).click();
    await page.getByRole("option", { name: /zone/i }).click();
    await page.getByLabel(/zone value/i).fill("10"); // Invalid zone

    // Verify error message
    await expect(page.getByText(/1.*7/i)).toBeVisible(); // "between 1 and 7"
  });

  test("should support undo/redo functionality", async ({ page }) => {
    await page.goto("/");

    // Create a workout with a step
    await page.getByRole("button", { name: /create new workout/i }).click();
    await page.getByLabel(/workout name/i).fill("Undo Test");
    await page.getByLabel(/sport/i).click();
    await page.getByRole("option", { name: /cycling/i }).click();
    await page.getByRole("button", { name: /create/i }).click();

    // Add a step
    await page.getByRole("button", { name: /add step/i }).click();
    await page.getByLabel(/duration value/i).fill("300");
    await page.getByLabel(/target value/i).fill("200");
    await page.getByRole("button", { name: /save step/i }).click();

    // Verify step is added
    await expect(page.getByText("Step 1")).toBeVisible();

    // Undo the step addition
    await page.keyboard.press("Control+Z");

    // Verify step is removed
    await expect(page.getByText("Step 1")).not.toBeVisible();

    // Redo the step addition
    await page.keyboard.press("Control+Y");

    // Verify step is back
    await expect(page.getByText("Step 1")).toBeVisible();
  });
});
