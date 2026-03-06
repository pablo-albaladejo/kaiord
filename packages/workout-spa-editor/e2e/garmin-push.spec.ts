import { expandFileUpload } from "./helpers/expand-file-upload";
import { expect, test } from "./fixtures/base";
import { mockLambdaAuthError, mockLambdaSuccess } from "./fixtures/api-mocks";

/**
 * E2E: Garmin Push Flow
 *
 * Tests pushing workouts to Garmin Connect via the Lambda proxy.
 * Lambda endpoint is intercepted with page.route() to return mock responses.
 */

test.describe("Garmin Push Flow", () => {
  test("8.5: push to Garmin success - shows URL", async ({ page }) => {
    await mockLambdaSuccess(page);
    await page.goto("/");

    // Load a workout first
    await loadTestWorkout(page);

    // Configure Garmin credentials
    await configureGarminCredentials(page);

    // Click push button
    const pushButton = page.getByRole("button", {
      name: /push to garmin/i,
    });
    await expect(pushButton).toBeVisible({ timeout: 5000 });
    await pushButton.click();

    // Should show success with Garmin Connect link
    await expect(page.getByText(/open in garmin connect/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test("8.6: push error flow - 401 shows error message", async ({ page }) => {
    await mockLambdaAuthError(page);
    await page.goto("/");

    // Load a workout first
    await loadTestWorkout(page);

    // Configure Garmin credentials
    await configureGarminCredentials(page);

    // Click push button
    const pushButton = page.getByRole("button", {
      name: /push to garmin/i,
    });
    await expect(pushButton).toBeVisible({ timeout: 5000 });
    await pushButton.click();

    // Should show auth error message
    await expect(
      page.getByText(/authentication|credentials/i).first()
    ).toBeVisible({ timeout: 10000 });

    // Should offer link to check credentials
    await expect(page.getByText(/check credentials/i)).toBeVisible();
  });

  test("8.7a: no Garmin credentials shows configure button", async ({
    page,
  }) => {
    await page.goto("/");
    await loadTestWorkout(page);

    // Without credentials, should show "Configure Garmin" button
    const configButton = page.getByRole("button", {
      name: /configure garmin/i,
    });
    await expect(configButton).toBeVisible({ timeout: 5000 });
  });
});

/** Load a minimal test workout via file upload. */
async function loadTestWorkout(
  page: import("@playwright/test").Page
): Promise<void> {
  const testWorkout = {
    version: "1.0",
    type: "structured_workout",
    metadata: { created: new Date().toISOString(), sport: "cycling" },
    extensions: {
      structured_workout: {
        name: "Push Test Workout",
        sport: "cycling",
        steps: [
          {
            stepIndex: 0,
            durationType: "time",
            duration: { type: "time", seconds: 600 },
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

  await expandFileUpload(page);
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: "push-test.krd",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(testWorkout)),
  });

  await expect(page.getByText("Push Test Workout")).toBeVisible({
    timeout: 10000,
  });
}

/** Configure Garmin credentials via the Settings panel. */
async function configureGarminCredentials(
  page: import("@playwright/test").Page
): Promise<void> {
  // Open settings (use exact match to avoid matching "Open Settings" button)
  await page
    .getByRole("button", { name: "Open settings", exact: true })
    .click();

  const dialog = page.getByRole("dialog", { name: "Settings" });
  await expect(dialog).toBeVisible({ timeout: 5000 });

  // Switch to Garmin tab
  await dialog.getByRole("tab", { name: /^garmin$/i }).click();

  // Wait for Garmin tab content to render
  await expect(dialog.getByText("Garmin Connect Credentials")).toBeVisible({
    timeout: 5000,
  });

  // Fill credentials
  await dialog.getByPlaceholder("your@email.com").fill("test@garmin.com");
  await dialog.getByPlaceholder("Your Garmin password").fill("test-password");

  // Close settings
  await page.keyboard.press("Escape");
}
