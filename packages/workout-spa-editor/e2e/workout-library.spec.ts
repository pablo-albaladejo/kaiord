/**
 * Workout Library E2E Tests
 *
 * End-to-end tests for the workout library feature covering:
 * - Saving workouts to library
 * - Loading workouts from library
 * - Searching and filtering workouts
 * - Deleting workouts from library
 *
 * Requirements: 17, 18
 */

import { expect, test } from "./fixtures/base";

test.describe("Workout Library", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto("/");

    // Clear localStorage to start fresh
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test.describe("saving workouts", () => {
    test("should save a workout to library", async ({ page }) => {
      // Arrange - Create a simple workout
      await page.getByRole("button", { name: /add step/i }).click();

      // Act - Save to library
      await page.getByRole("button", { name: /save to library/i }).click();

      // Fill in workout details
      await page.getByLabel("Workout Name").fill("Test Workout");
      await page.getByLabel("Tags").fill("test, easy");

      // Save
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /save to library/i })
        .click();

      // Assert - Success toast should appear
      await expect(page.getByText(/workout saved to library/i)).toBeVisible();
    });

    test("should save workout with all metadata", async ({ page }) => {
      // Arrange - Create a workout
      await page.getByRole("button", { name: /add step/i }).click();

      // Act - Save with full metadata
      await page.getByRole("button", { name: /save to library/i }).click();

      await page.getByLabel("Workout Name").fill("Complete Workout");
      await page.getByLabel("Tags").fill("intervals, hard");
      await page.getByLabel("Difficulty").selectOption("hard");
      await page.getByLabel("Notes").fill("High intensity workout");

      await page
        .getByRole("dialog")
        .getByRole("button", { name: /save to library/i })
        .click();

      // Assert
      await expect(page.getByText(/workout saved to library/i)).toBeVisible();
    });

    test("should require workout name", async ({ page }) => {
      // Arrange
      await page.getByRole("button", { name: /add step/i }).click();

      // Act - Try to save without name
      await page.getByRole("button", { name: /save to library/i }).click();

      // Leave name empty
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /save to library/i })
        .click();

      // Assert - Should show validation error
      await expect(page.getByText(/workout name is required/i)).toBeVisible();
    });
  });

  test.describe("loading workouts", () => {
    test("should load a workout from library", async ({ page }) => {
      // Arrange - Save a workout first
      await page.getByRole("button", { name: /add step/i }).click();
      await page.getByRole("button", { name: /save to library/i }).click();
      await page.getByLabel("Workout Name").fill("Load Test");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /save to library/i })
        .click();
      await expect(page.getByText(/workout saved to library/i)).toBeVisible();

      // Clear the current workout
      await page.evaluate(() => {
        localStorage.removeItem("workout-spa-current-workout");
      });
      await page.reload();

      // Act - Open library and load workout
      await page.getByRole("button", { name: /open library/i }).click();
      await page
        .getByRole("button", { name: /^load$/i })
        .first()
        .click();

      // Assert - Workout should be loaded
      await expect(page.getByTestId("step-card")).toHaveCount(1);
    });

    test("should show confirmation when replacing current workout", async ({
      page,
    }) => {
      // Arrange - Create and save a workout
      await page.getByRole("button", { name: /add step/i }).click();
      await page.getByRole("button", { name: /save to library/i }).click();
      await page.getByLabel("Workout Name").fill("Saved Workout");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /save to library/i })
        .click();
      await expect(page.getByText(/workout saved to library/i)).toBeVisible();

      // Create a different current workout
      await page.getByRole("button", { name: /add step/i }).click();

      // Act - Try to load from library
      await page.getByRole("button", { name: /open library/i }).click();
      await page
        .getByRole("button", { name: /^load$/i })
        .first()
        .click();

      // Assert - Should show confirmation dialog
      await expect(page.getByText(/replace current workout/i)).toBeVisible();
    });

    test("should load workout after confirmation", async ({ page }) => {
      // Arrange - Save a workout
      await page.getByRole("button", { name: /add step/i }).click();
      await page.getByRole("button", { name: /save to library/i }).click();
      await page.getByLabel("Workout Name").fill("Confirm Load");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /save to library/i })
        .click();
      await expect(page.getByText(/workout saved to library/i)).toBeVisible();

      // Create different current workout
      await page.getByRole("button", { name: /add step/i }).click();

      // Act - Load with confirmation
      await page.getByRole("button", { name: /open library/i }).click();
      await page
        .getByRole("button", { name: /^load$/i })
        .first()
        .click();
      await page.getByRole("button", { name: /load workout/i }).click();

      // Assert - Should load the saved workout (1 step)
      await expect(page.getByTestId("step-card")).toHaveCount(1);
    });
  });

  test.describe("search and filter", () => {
    test("should search workouts by name", async ({ page }) => {
      // Arrange - Save multiple workouts
      await page.getByRole("button", { name: /add step/i }).click();
      await page.getByRole("button", { name: /save to library/i }).click();
      await page.getByLabel("Workout Name").fill("Morning Run");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /save to library/i })
        .click();
      await expect(page.getByText(/workout saved to library/i)).toBeVisible();

      await page.getByRole("button", { name: /save to library/i }).click();
      await page.getByLabel("Workout Name").fill("Evening Ride");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /save to library/i })
        .click();
      await expect(page.getByText(/workout saved to library/i)).toBeVisible();

      // Act - Search for "morning"
      await page.getByRole("button", { name: /open library/i }).click();
      await page.getByPlaceholder(/search workouts by name/i).fill("morning");

      // Assert - Should show only Morning Run
      await expect(page.getByText("Morning Run")).toBeVisible();
      await expect(page.getByText("Evening Ride")).not.toBeVisible();
    });

    test("should filter workouts by tags", async ({ page }) => {
      // Arrange - Save workouts with different tags
      await page.getByRole("button", { name: /add step/i }).click();
      await page.getByRole("button", { name: /save to library/i }).click();
      await page.getByLabel("Workout Name").fill("Easy Workout");
      await page.getByLabel("Tags").fill("easy, recovery");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /save to library/i })
        .click();
      await expect(page.getByText(/workout saved to library/i)).toBeVisible();

      await page.getByRole("button", { name: /save to library/i }).click();
      await page.getByLabel("Workout Name").fill("Hard Workout");
      await page.getByLabel("Tags").fill("hard, intervals");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /save to library/i })
        .click();
      await expect(page.getByText(/workout saved to library/i)).toBeVisible();

      // Act - Filter by "easy" tag
      await page.getByRole("button", { name: /open library/i }).click();
      await page.getByRole("button", { name: "easy" }).first().click();

      // Assert - Should show only Easy Workout
      await expect(page.getByText("Easy Workout")).toBeVisible();
      await expect(page.getByText("Hard Workout")).not.toBeVisible();
    });

    test("should show no results message when search has no matches", async ({
      page,
    }) => {
      // Arrange - Save a workout
      await page.getByRole("button", { name: /add step/i }).click();
      await page.getByRole("button", { name: /save to library/i }).click();
      await page.getByLabel("Workout Name").fill("Test Workout");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /save to library/i })
        .click();
      await expect(page.getByText(/workout saved to library/i)).toBeVisible();

      // Act - Search for non-existent workout
      await page.getByRole("button", { name: /open library/i }).click();
      await page
        .getByPlaceholder(/search workouts by name/i)
        .fill("nonexistent");

      // Assert - Should show no results message
      await expect(
        page.getByText(/no workouts match your search criteria/i)
      ).toBeVisible();
    });
  });

  test.describe("deleting workouts", () => {
    test("should delete a workout from library", async ({ page }) => {
      // Arrange - Save a workout
      await page.getByRole("button", { name: /add step/i }).click();
      await page.getByRole("button", { name: /save to library/i }).click();
      await page.getByLabel("Workout Name").fill("Delete Me");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /save to library/i })
        .click();
      await expect(page.getByText(/workout saved to library/i)).toBeVisible();

      // Act - Delete the workout
      await page.getByRole("button", { name: /open library/i }).click();
      await page.getByLabel("Delete workout").click();
      await page.getByRole("button", { name: /^delete$/i }).click();

      // Assert - Workout should be removed
      await expect(page.getByText("Delete Me")).not.toBeVisible();
      await expect(page.getByText(/no workouts saved yet/i)).toBeVisible();
    });

    test("should show confirmation before deleting", async ({ page }) => {
      // Arrange - Save a workout
      await page.getByRole("button", { name: /add step/i }).click();
      await page.getByRole("button", { name: /save to library/i }).click();
      await page.getByLabel("Workout Name").fill("Confirm Delete");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /save to library/i })
        .click();
      await expect(page.getByText(/workout saved to library/i)).toBeVisible();

      // Act - Click delete
      await page.getByRole("button", { name: /open library/i }).click();
      await page.getByLabel("Delete workout").click();

      // Assert - Should show confirmation dialog
      await expect(page.getByText(/delete workout/i)).toBeVisible();
      await expect(
        page.getByText(/are you sure you want to delete this workout/i)
      ).toBeVisible();
    });

    test("should cancel delete operation", async ({ page }) => {
      // Arrange - Save a workout
      await page.getByRole("button", { name: /add step/i }).click();
      await page.getByRole("button", { name: /save to library/i }).click();
      await page.getByLabel("Workout Name").fill("Keep Me");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /save to library/i })
        .click();
      await expect(page.getByText(/workout saved to library/i)).toBeVisible();

      // Act - Cancel delete
      await page.getByRole("button", { name: /open library/i }).click();
      await page.getByLabel("Delete workout").click();
      await page.getByRole("button", { name: /cancel/i }).click();

      // Assert - Workout should still be there
      await expect(page.getByText("Keep Me")).toBeVisible();
    });
  });

  test.describe("empty state", () => {
    test("should show empty state when no workouts saved", async ({ page }) => {
      // Act - Open library
      await page.getByRole("button", { name: /open library/i }).click();

      // Assert - Should show empty state
      await expect(page.getByText(/no workouts saved yet/i)).toBeVisible();
      await expect(
        page.getByText(/create and save a workout to get started/i)
      ).toBeVisible();
    });
  });

  test.describe("preview functionality", () => {
    test("should preview workout details", async ({ page }) => {
      // Arrange - Save a workout with metadata
      await page.getByRole("button", { name: /add step/i }).click();
      await page.getByRole("button", { name: /save to library/i }).click();
      await page.getByLabel("Workout Name").fill("Preview Test");
      await page.getByLabel("Tags").fill("test, preview");
      await page.getByLabel("Difficulty").selectOption("moderate");
      await page.getByLabel("Notes").fill("Test notes");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /save to library/i })
        .click();
      await expect(page.getByText(/workout saved to library/i)).toBeVisible();

      // Act - Open preview
      await page.getByRole("button", { name: /open library/i }).click();
      await page.getByRole("button", { name: /preview/i }).click();

      // Assert - Should show workout details
      await expect(page.getByText("Preview Test")).toBeVisible();
      await expect(page.getByText("test")).toBeVisible();
      await expect(page.getByText("preview")).toBeVisible();
      await expect(page.getByText("moderate")).toBeVisible();
      await expect(page.getByText("Test notes")).toBeVisible();
    });

    test("should load workout from preview dialog", async ({ page }) => {
      // Arrange - Save a workout
      await page.getByRole("button", { name: /add step/i }).click();
      await page.getByRole("button", { name: /save to library/i }).click();
      await page.getByLabel("Workout Name").fill("Load from Preview");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /save to library/i })
        .click();
      await expect(page.getByText(/workout saved to library/i)).toBeVisible();

      // Clear current workout
      await page.evaluate(() => {
        localStorage.removeItem("workout-spa-current-workout");
      });
      await page.reload();

      // Act - Load from preview
      await page.getByRole("button", { name: /open library/i }).click();
      await page.getByRole("button", { name: /preview/i }).click();
      await page.getByRole("button", { name: /load workout/i }).click();

      // Assert - Workout should be loaded
      await expect(page.getByTestId("step-card")).toHaveCount(1);
    });
  });
});
