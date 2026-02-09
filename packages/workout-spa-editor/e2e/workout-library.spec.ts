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
import { loadTestWorkout } from "./helpers/load-test-workout";

test.describe("Workout Library", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto("/");

    // Clear localStorage to start fresh
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Load a test workout so workout editing features are available
    await loadTestWorkout(page, "Library Test Workout");
  });

  test.describe("saving workouts", () => {
    test("should save a workout to library", async ({ page }) => {
      // Arrange - Create a simple workout
      await page.getByTestId("add-step-button").click();

      // Act - Save to library
      await page.getByRole("button", { name: /save to library/i }).click();

      // Wait for dialog to be visible
      await page.getByRole("dialog").waitFor({ state: "visible" });

      // Fill in workout details
      await page.getByLabel("Workout Name").fill("Test Workout");
      await page.getByLabel("Tags").fill("test, easy");

      // Save
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /^save$/i })
        .click();

      // Assert - Success toast should appear
      await expect(page.getByText("Workout Saved").first()).toBeVisible();
    });

    test("should save workout with all metadata", async ({ page }) => {
      // Arrange - Create a workout
      await page.getByTestId("add-step-button").click();

      // Act - Save with full metadata
      await page.getByRole("button", { name: /save to library/i }).click();

      await page.getByLabel("Workout Name").fill("Complete Workout");
      await page.getByLabel("Tags").fill("intervals, hard");
      await page.getByLabel("Difficulty").selectOption("hard");
      await page.getByLabel("Notes").fill("High intensity workout");

      await page
        .getByRole("dialog")
        .getByRole("button", { name: /^save$/i })
        .click();

      // Assert
      await expect(page.getByText("Workout Saved").first()).toBeVisible();
    });

    test("should require workout name", async ({ page }) => {
      // Arrange
      await page.getByTestId("add-step-button").click();

      // Act - Try to save without name
      await page.getByRole("button", { name: /save to library/i }).click();

      // Wait for dialog to be visible
      await page.getByRole("dialog").waitFor({ state: "visible" });

      // Assert - Save button should be disabled when name is empty
      const saveButton = page
        .getByRole("dialog")
        .getByRole("button", { name: /^save$/i });
      await expect(saveButton).toBeDisabled();
    });
  });

  test.describe("loading workouts", () => {
    test("should load a workout from library", async ({ page }) => {
      // Arrange - Save a workout first
      await page.getByTestId("add-step-button").click();
      await page.getByRole("button", { name: /save to library/i }).click();
      await page.getByLabel("Workout Name").fill("Load Test");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /^save$/i })
        .click();

      // Wait for save to complete and toast to appear
      await expect(page.getByText("Workout Saved").first()).toBeVisible();

      // Wait for dialog to close after save
      await page.getByRole("dialog").waitFor({ state: "hidden" });

      // Verify the workout was saved to library localStorage
      const libraryData = await page.evaluate(() =>
        localStorage.getItem("workout-spa-library")
      );
      if (!libraryData) {
        throw new Error("Library data not found in localStorage after save");
      }

      // Clear the current workout
      await page.evaluate(() => {
        localStorage.removeItem("workout-spa-current-workout");
      });
      await page.reload();

      // Act - Open library and load workout
      await page.getByRole("button", { name: /open workout library/i }).click();

      // Wait for library dialog to be visible
      await page.getByRole("dialog").waitFor({ state: "visible" });

      // Wait for workout card to appear (library might need time to load)
      await page.getByTestId("workout-card").waitFor({ state: "visible" });

      await page
        .getByRole("button", { name: /^load$/i })
        .first()
        .click();

      // Assert - Workout should be loaded (2 from test workout + 1 added)
      await expect(page.getByTestId("step-card")).toHaveCount(3);
    });

    test("should show confirmation when replacing current workout", async ({
      page,
    }) => {
      // Arrange - Create and save a workout
      await page.getByTestId("add-step-button").click();
      await page.getByRole("button", { name: /save to library/i }).click();
      await page.getByLabel("Workout Name").fill("Saved Workout");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /^save$/i })
        .click();
      await expect(page.getByText("Workout Saved").first()).toBeVisible();

      // Create a different current workout
      await page.getByTestId("add-step-button").click();

      // Act - Try to load from library
      await page.getByRole("button", { name: /open workout library/i }).click();
      await page
        .getByRole("button", { name: /^load$/i })
        .first()
        .click();

      // Assert - Should show confirmation dialog
      await expect(page.getByText(/replace current workout/i)).toBeVisible();
    });

    test("should load workout after confirmation", async ({ page }) => {
      // Arrange - Save a workout
      await page.getByTestId("add-step-button").click();
      await page.getByRole("button", { name: /save to library/i }).click();
      await page.getByLabel("Workout Name").fill("Confirm Load");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /^save$/i })
        .click();
      await expect(page.getByText("Workout Saved").first()).toBeVisible();

      // Create different current workout
      await page.getByTestId("add-step-button").click();

      // Act - Load with confirmation
      await page.getByRole("button", { name: /open workout library/i }).click();
      await page
        .getByRole("button", { name: /^load$/i })
        .first()
        .click();
      await page.getByRole("button", { name: /load workout/i }).click();

      // Assert - Should load the saved workout (2 from test workout + 1 added)
      await expect(page.getByTestId("step-card")).toHaveCount(3);
    });
  });

  test.describe("search and filter", () => {
    test("should search workouts by name", async ({ page }) => {
      // Arrange - Save multiple workouts
      await page.getByTestId("add-step-button").click();
      await page.getByRole("button", { name: /save to library/i }).click();
      await page.getByLabel("Workout Name").fill("Morning Run");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /^save$/i })
        .click();
      await expect(page.getByText("Workout Saved").first()).toBeVisible();

      await page.getByRole("button", { name: /save to library/i }).click();
      await page.getByLabel("Workout Name").fill("Evening Ride");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /^save$/i })
        .click();
      await expect(page.getByText("Workout Saved").first()).toBeVisible();

      // Act - Search for "morning"
      await page.getByRole("button", { name: /open workout library/i }).click();
      await page.getByPlaceholder(/search workouts/i).fill("morning");

      // Assert - Should show only Morning Run
      await expect(
        page.getByRole("heading", { name: "Morning Run" })
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Evening Ride" })
      ).not.toBeVisible();
    });

    test("should filter workouts by tags", async ({ page }) => {
      // Arrange - Save workouts with different tags
      await page.getByTestId("add-step-button").click();
      await page.getByRole("button", { name: /save to library/i }).click();
      await page.getByLabel("Workout Name").fill("Easy Workout");
      await page.getByLabel("Tags").fill("easy, recovery");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /^save$/i })
        .click();
      await expect(page.getByText("Workout Saved").first()).toBeVisible();

      await page.getByRole("button", { name: /save to library/i }).click();
      await page.getByLabel("Workout Name").fill("Hard Workout");
      await page.getByLabel("Tags").fill("hard, intervals");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /^save$/i })
        .click();
      await expect(page.getByText("Workout Saved").first()).toBeVisible();

      // Act - Filter by "easy" tag
      await page.getByRole("button", { name: /open workout library/i }).click();
      await page.getByRole("button", { name: "easy" }).first().click();

      // Assert - Should show only Easy Workout
      await expect(
        page.getByRole("heading", { name: "Easy Workout" })
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Hard Workout" })
      ).not.toBeVisible();
    });

    test("should show no results message when search has no matches", async ({
      page,
    }) => {
      // Arrange - Save a workout
      await page.getByTestId("add-step-button").click();
      await page.getByRole("button", { name: /save to library/i }).click();
      await page.getByLabel("Workout Name").fill("Test Workout");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /^save$/i })
        .click();
      await expect(page.getByText("Workout Saved").first()).toBeVisible();

      // Act - Search for non-existent workout
      await page.getByRole("button", { name: /open workout library/i }).click();
      await page.getByPlaceholder(/search workouts/i).fill("nonexistent");

      // Assert - Should show no results message
      await expect(
        page.getByText(/no workouts match your current filters/i)
      ).toBeVisible();
    });
  });

  test.describe("deleting workouts", () => {
    test("should delete a workout from library", async ({ page }) => {
      // Arrange - Save a workout
      await page.getByTestId("add-step-button").click();
      await page.getByRole("button", { name: /save to library/i }).click();
      await page.getByLabel("Workout Name").fill("Delete Me");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /^save$/i })
        .click();
      await expect(page.getByText("Workout Saved").first()).toBeVisible();

      // Act - Delete the workout
      await page.getByRole("button", { name: /open workout library/i }).click();
      await page.getByLabel(/^Delete Delete Me$/i).click();
      await page.getByRole("button", { name: /^delete$/i }).click();

      // Assert - Workout should be removed
      await expect(
        page.getByRole("heading", { name: "Delete Me" })
      ).not.toBeVisible();
      await expect(page.getByText(/your library is empty/i)).toBeVisible();
    });

    test("should show confirmation before deleting", async ({ page }) => {
      // Arrange - Save a workout
      await page.getByTestId("add-step-button").click();
      await page.getByRole("button", { name: /save to library/i }).click();
      await page.getByLabel("Workout Name").fill("Confirm Delete");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /^save$/i })
        .click();
      await expect(page.getByText("Workout Saved").first()).toBeVisible();

      // Act - Click delete
      await page.getByRole("button", { name: /open workout library/i }).click();
      await page.getByLabel(/^Delete Confirm Delete$/i).click();

      // Assert - Should show confirmation dialog
      await expect(page.getByText(/delete workout/i)).toBeVisible();
      await expect(
        page.getByText(/are you sure you want to delete/i)
      ).toBeVisible();
    });

    test("should cancel delete operation", async ({ page }) => {
      // Arrange - Save a workout
      await page.getByTestId("add-step-button").click();
      await page.getByRole("button", { name: /save to library/i }).click();
      await page.getByLabel("Workout Name").fill("Keep Me");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /^save$/i })
        .click();
      await expect(page.getByText("Workout Saved").first()).toBeVisible();

      // Act - Cancel delete
      await page.getByRole("button", { name: /open workout library/i }).click();
      await page.getByLabel(/^Delete Keep Me$/i).click();
      await page.getByRole("button", { name: /cancel/i }).click();

      // Assert - Workout should still be there
      await expect(
        page.getByRole("heading", { name: "Keep Me" })
      ).toBeVisible();
    });
  });

  test.describe("empty state", () => {
    test("should show empty state when no workouts saved", async ({ page }) => {
      // Act - Open library
      await page.getByRole("button", { name: /open workout library/i }).click();

      // Assert - Should show empty state
      await expect(page.getByText(/your library is empty/i)).toBeVisible();
      await expect(
        page.getByText(/create your first workout and save it to your library/i)
      ).toBeVisible();
    });
  });

  test.describe("preview functionality", () => {
    test("should preview workout details", async ({ page }) => {
      // Arrange - Save a workout with metadata
      await page.getByTestId("add-step-button").click();
      await page.getByRole("button", { name: /save to library/i }).click();
      await page.getByLabel("Workout Name").fill("Preview Test");
      await page.getByLabel("Tags").fill("test, preview");
      await page.getByLabel("Difficulty").selectOption("moderate");
      await page.getByLabel("Notes").fill("Test notes");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /^save$/i })
        .click();
      await expect(page.getByText("Workout Saved").first()).toBeVisible();

      // Act - Open preview
      await page.getByRole("button", { name: /open workout library/i }).click();
      await page.getByRole("button", { name: "Preview", exact: true }).click();

      // Assert - Should show workout details in the preview dialog
      const previewDialog = page.getByRole("dialog").last();
      await expect(
        previewDialog.getByRole("heading", { name: "Preview Test" })
      ).toBeVisible();
      await expect(
        previewDialog.getByText("test", { exact: true })
      ).toBeVisible();
      await expect(
        previewDialog.getByText("preview", { exact: true })
      ).toBeVisible();
      await expect(previewDialog.getByText("moderate")).toBeVisible();
      await expect(previewDialog.getByText("Test notes")).toBeVisible();
    });

    test("should load workout from preview dialog", async ({ page }) => {
      // Arrange - Save a workout
      await page.getByTestId("add-step-button").click();
      await page.getByRole("button", { name: /save to library/i }).click();
      await page.getByLabel("Workout Name").fill("Load from Preview");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /^save$/i })
        .click();
      await expect(page.getByText("Workout Saved").first()).toBeVisible();

      // Clear current workout
      await page.evaluate(() => {
        localStorage.removeItem("workout-spa-current-workout");
      });
      await page.reload();

      // Act - Load from preview
      await page.getByRole("button", { name: /open workout library/i }).click();
      await page.getByRole("button", { name: "Preview", exact: true }).click();
      await page.getByRole("button", { name: /load workout/i }).click();

      // Assert - Workout should be loaded (2 from test workout + 1 added)
      await expect(page.getByTestId("step-card")).toHaveCount(3);
    });
  });
});
