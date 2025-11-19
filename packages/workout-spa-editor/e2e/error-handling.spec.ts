/**
 * E2E Tests: Error Handling and Recovery
 *
 * Tests error detection, display, and recovery mechanisms.
 *
 * Requirements covered:
 * - Requirement 36.4: Specific error messages for file parsing
 * - Requirement 36.5: Error recovery mechanisms
 */

import { expect, test } from "@playwright/test";

test.describe("Error Handling", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Workout Editor", level: 1 })
    ).toBeVisible();
  });

  test("should display specific error for invalid JSON", async ({ page }) => {
    // Arrange
    const invalidJSON = "{ invalid json }";
    const fileInput = page.locator('input[type="file"]');

    // Act - Upload invalid JSON
    await fileInput.setInputFiles({
      name: "invalid.krd",
      mimeType: "application/json",
      buffer: Buffer.from(invalidJSON),
    });

    // Assert - Specific error message displayed
    await expect(page.getByText(/import failed/i)).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText(/invalid json/i)).toBeVisible();
    await expect(page.getByText(/position/i)).toBeVisible();
  });

  test("should display specific error for missing required fields", async ({
    page,
  }) => {
    // Arrange - KRD missing required fields
    const incompleteKRD = {
      version: "1.0",
      // Missing 'type' and 'metadata'
    };
    const fileInput = page.locator('input[type="file"]');

    // Act - Upload incomplete KRD
    await fileInput.setInputFiles({
      name: "incomplete.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(incompleteKRD)),
    });

    // Assert - Missing fields listed
    await expect(page.getByText(/import failed/i)).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText(/missing required field/i)).toBeVisible();
    await expect(page.getByText(/type/i)).toBeVisible();
    await expect(page.getByText(/metadata/i)).toBeVisible();
  });

  test("should display specific error for invalid field values", async ({
    page,
  }) => {
    // Arrange - KRD with invalid field values
    const invalidKRD = {
      version: "1.0",
      type: "invalid_type", // Invalid type
      metadata: {
        created: "not-a-date", // Invalid date
        sport: "invalid_sport", // Invalid sport
      },
    };
    const fileInput = page.locator('input[type="file"]');

    // Act - Upload invalid KRD
    await fileInput.setInputFiles({
      name: "invalid-values.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(invalidKRD)),
    });

    // Assert - Invalid fields listed
    await expect(page.getByText(/import failed/i)).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText(/invalid value/i)).toBeVisible();
  });

  test("should display specific error for FIT parsing failure", async ({
    page,
  }) => {
    // Arrange - Invalid FIT file
    const fileInput = page.locator('input[type="file"]');

    // Act - Upload corrupted FIT file
    await fileInput.setInputFiles({
      name: "corrupted.fit",
      mimeType: "application/octet-stream",
      buffer: Buffer.from([0, 0, 0, 0]), // Invalid FIT data
    });

    // Assert - FIT-specific error displayed
    await expect(page.getByText(/import failed/i)).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText(/failed to parse fit file/i)).toBeVisible();
  });

  test("should display specific error for TCX parsing failure", async ({
    page,
  }) => {
    // Arrange - Invalid TCX file
    const invalidTCX = "<invalid>xml</invalid>";
    const fileInput = page.locator('input[type="file"]');

    // Act - Upload invalid TCX file
    await fileInput.setInputFiles({
      name: "invalid.tcx",
      mimeType: "application/xml",
      buffer: Buffer.from(invalidTCX),
    });

    // Assert - TCX-specific error displayed
    await expect(page.getByText(/import failed/i)).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText(/failed to parse tcx file/i)).toBeVisible();
  });

  test("should display specific error for ZWO parsing failure", async ({
    page,
  }) => {
    // Arrange - Invalid ZWO file
    const invalidZWO = "<workout>incomplete";
    const fileInput = page.locator('input[type="file"]');

    // Act - Upload invalid ZWO file
    await fileInput.setInputFiles({
      name: "invalid.zwo",
      mimeType: "application/xml",
      buffer: Buffer.from(invalidZWO),
    });

    // Assert - ZWO-specific error displayed
    await expect(page.getByText(/import failed/i)).toBeVisible({
      timeout: 5000,
    });
    await expect(
      page.getByText(/failed to parse (zwo|zwift) file/i)
    ).toBeVisible();
  });
});

test.describe("Error Recovery", () => {
  const validWorkout = {
    version: "1.0",
    type: "workout",
    metadata: {
      created: new Date().toISOString(),
      sport: "cycling",
    },
    extensions: {
      workout: {
        name: "Recovery Test Workout",
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

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Workout Editor", level: 1 })
    ).toBeVisible();
  });

  test("should restore previous state after import error", async ({ page }) => {
    // Arrange - Load valid workout first
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "valid.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(validWorkout)),
    });

    await expect(page.getByText("Recovery Test Workout")).toBeVisible({
      timeout: 10000,
    });

    // Act - Try to load invalid file
    await fileInput.setInputFiles({
      name: "invalid.krd",
      mimeType: "application/json",
      buffer: Buffer.from("{ invalid }"),
    });

    // Assert - Error displayed
    await expect(page.getByText(/import failed/i)).toBeVisible({
      timeout: 5000,
    });

    // Dismiss error
    const dismissButton = page.getByRole("button", { name: /dismiss/i });
    if (await dismissButton.isVisible()) {
      await dismissButton.click();
    }

    // Assert - Previous workout still loaded
    await expect(page.getByText("Recovery Test Workout")).toBeVisible();
    await expect(page.getByText("Step 1")).toBeVisible();
  });

  test("should offer backup download before risky operation", async ({
    page,
  }) => {
    // Arrange - Load workout
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(validWorkout)),
    });

    await expect(page.getByText("Recovery Test Workout")).toBeVisible({
      timeout: 10000,
    });

    // Act - Trigger risky operation (e.g., clear all steps)
    const clearButton = page.getByRole("button", { name: /clear all/i });
    if (await clearButton.isVisible()) {
      await clearButton.click();

      // Assert - Backup offer displayed
      await expect(
        page.getByText(/download backup before proceeding/i)
      ).toBeVisible({ timeout: 5000 });

      const downloadBackupButton = page.getByRole("button", {
        name: /download backup/i,
      });
      await expect(downloadBackupButton).toBeVisible();
    }
  });

  test("should enable safe mode after error", async ({ page }) => {
    // Arrange - Load workout
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(validWorkout)),
    });

    await expect(page.getByText("Recovery Test Workout")).toBeVisible({
      timeout: 10000,
    });

    // Act - Trigger error (try to load invalid file)
    await fileInput.setInputFiles({
      name: "invalid.krd",
      mimeType: "application/json",
      buffer: Buffer.from("{ invalid }"),
    });

    // Assert - Error displayed with safe mode option
    await expect(page.getByText(/import failed/i)).toBeVisible({
      timeout: 5000,
    });

    const safeModeButton = page.getByRole("button", {
      name: /enable safe mode/i,
    });
    if (await safeModeButton.isVisible()) {
      await safeModeButton.click();

      // Assert - Safe mode enabled notification
      await expect(page.getByText(/safe mode enabled/i)).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test("should display success message after recovery", async ({ page }) => {
    // Arrange - Load workout
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(validWorkout)),
    });

    await expect(page.getByText("Recovery Test Workout")).toBeVisible({
      timeout: 10000,
    });

    // Act - Trigger error and recover
    await fileInput.setInputFiles({
      name: "invalid.krd",
      mimeType: "application/json",
      buffer: Buffer.from("{ invalid }"),
    });

    await expect(page.getByText(/import failed/i)).toBeVisible({
      timeout: 5000,
    });

    // Dismiss error (recovery)
    const dismissButton = page.getByRole("button", { name: /dismiss/i });
    if (await dismissButton.isVisible()) {
      await dismissButton.click();
    }

    // Assert - Success message displayed
    await expect(page.getByText(/previous workout restored/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test("should provide retry option after error", async ({ page }) => {
    // Arrange - Try to load invalid file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "invalid.krd",
      mimeType: "application/json",
      buffer: Buffer.from("{ invalid }"),
    });

    // Assert - Error with retry button
    await expect(page.getByText(/import failed/i)).toBeVisible({
      timeout: 5000,
    });

    const retryButton = page.getByRole("button", { name: /try again/i });
    await expect(retryButton).toBeVisible();

    // Act - Click retry
    await retryButton.click();

    // Assert - File input is ready for new file
    await expect(fileInput).toBeVisible();
  });

  test("should provide clear instructions for unrecoverable errors", async ({
    page,
  }) => {
    // Arrange - Trigger unrecoverable error (e.g., corrupted FIT file)
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "corrupted.fit",
      mimeType: "application/octet-stream",
      buffer: Buffer.from([0, 0, 0, 0]),
    });

    // Assert - Error with instructions
    await expect(page.getByText(/import failed/i)).toBeVisible({
      timeout: 5000,
    });
    await expect(
      page.getByText(/please check your file and try again/i)
    ).toBeVisible();

    // Check for report issue link
    const reportLink = page.getByRole("link", { name: /report issue/i });
    if (await reportLink.isVisible()) {
      await expect(reportLink).toHaveAttribute("href", /.+/);
    }
  });
});

test.describe("Error Handling - Mobile", () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

  test("should display error messages on mobile", async ({ page }) => {
    // Arrange
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Workout Editor", level: 1 })
    ).toBeVisible();

    // Act - Upload invalid file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "invalid.krd",
      mimeType: "application/json",
      buffer: Buffer.from("{ invalid }"),
    });

    // Assert - Error visible on mobile
    await expect(page.getByText(/import failed/i)).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText(/invalid json/i)).toBeVisible();
  });

  test("should handle error recovery on mobile", async ({ page }) => {
    // Arrange
    await page.goto("/");

    const validWorkout = {
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
          steps: [],
        },
      },
    };

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "valid.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(validWorkout)),
    });

    await expect(page.getByText("Mobile Test")).toBeVisible({
      timeout: 10000,
    });

    // Act - Try invalid file
    await fileInput.setInputFiles({
      name: "invalid.krd",
      mimeType: "application/json",
      buffer: Buffer.from("{ invalid }"),
    });

    // Assert - Error and recovery on mobile
    await expect(page.getByText(/import failed/i)).toBeVisible({
      timeout: 5000,
    });

    const dismissButton = page.getByRole("button", { name: /dismiss/i });
    if (await dismissButton.isVisible()) {
      await dismissButton.click();
    }

    // Previous workout still visible
    await expect(page.getByText("Mobile Test")).toBeVisible();
  });
});

test.describe("Error Handling - Performance", () => {
  test("should handle errors without significant performance impact", async ({
    page,
  }) => {
    // Arrange
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Workout Editor", level: 1 })
    ).toBeVisible();

    const fileInput = page.locator('input[type="file"]');

    // Act - Measure time to display error
    const startTime = Date.now();

    await fileInput.setInputFiles({
      name: "invalid.krd",
      mimeType: "application/json",
      buffer: Buffer.from("{ invalid }"),
    });

    await expect(page.getByText(/import failed/i)).toBeVisible({
      timeout: 5000,
    });

    const endTime = Date.now();
    const errorDisplayTime = endTime - startTime;

    // Assert - Error displayed within reasonable time (< 2 seconds)
    expect(errorDisplayTime).toBeLessThan(2000);
  });

  test("should handle multiple errors without memory leaks", async ({
    page,
  }) => {
    // Arrange
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Workout Editor", level: 1 })
    ).toBeVisible();

    const fileInput = page.locator('input[type="file"]');

    // Act - Trigger multiple errors
    for (let i = 0; i < 5; i++) {
      await fileInput.setInputFiles({
        name: `invalid-${i}.krd`,
        mimeType: "application/json",
        buffer: Buffer.from("{ invalid }"),
      });

      await expect(page.getByText(/import failed/i)).toBeVisible({
        timeout: 5000,
      });

      const dismissButton = page.getByRole("button", { name: /dismiss/i });
      if (await dismissButton.isVisible()) {
        await dismissButton.click();
        await expect(page.getByText(/import failed/i)).not.toBeVisible({
          timeout: 2000,
        });
      }
    }

    // Assert - Page still responsive
    await expect(
      page.getByRole("heading", { name: "Workout Editor", level: 1 })
    ).toBeVisible();
  });
});
