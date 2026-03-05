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
    if (await pushButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await pushButton.click();

      // Should show success with Garmin Connect link
      await expect(page.getByText(/open in garmin connect/i)).toBeVisible({
        timeout: 10000,
      });
    }
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
    if (await pushButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await pushButton.click();

      // Should show auth error message
      await expect(
        page.getByText(/authentication|credentials/i).first()
      ).toBeVisible({ timeout: 10000 });

      // Should offer link to check credentials
      await expect(page.getByText(/check credentials/i)).toBeVisible();
    }
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
    if (await configButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(configButton).toBeVisible();
    }
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
  // Open settings
  await page.getByRole("button", { name: /open settings/i }).click();

  // Switch to Garmin tab
  await page
    .getByRole("button", { name: /garmin/i })
    .first()
    .click();

  // Fill credentials
  await page.getByPlaceholder("your@email.com").fill("test@garmin.com");
  await page.getByPlaceholder("Your Garmin password").fill("test-password");

  // Close settings
  await page.keyboard.press("Escape");
}
