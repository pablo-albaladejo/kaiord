/**
 * Workout Library E2E Tests
 *
 * End-to-end tests for the workout library feature covering:
 * - Saving workouts to library
 * - Loading workouts from library (via the routed `/library` page)
 * - Searching and filtering workouts
 * - Deleting workouts from library
 *
 * Per the SPA surface-classification rule (spec/spa-routing), the
 * Library is a routed page and the in-flow picker dialog is its
 * own narrow component. Tests below exercise the page surface
 * via `page.goto('/library')`; the picker has its own coverage in
 * `library-flows.spec.ts`.
 */

import { expect, test } from "./fixtures/base";
import { loadTestWorkout } from "./helpers/load-test-workout";
import { openHeaderAction } from "./helpers/mobile-menu";

test.describe("Workout Library", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the editor; clear localStorage; load a test workout
    // so the editor has data for save-to-library cases.
    await page.goto("/workout/new?source=scratch");
    await page.evaluate(() => {
      localStorage.clear();
    });
    await loadTestWorkout(page, "Library Test Workout");
  });

  test.describe("saving workouts", () => {
    test("should save a workout to library", async ({ page }) => {
      await page.getByTestId("add-step-button").click();

      await page.getByRole("button", { name: /save to library/i }).click();
      await page.getByRole("dialog").waitFor({ state: "visible" });

      await page.getByLabel("Workout Name").fill("Test Workout");
      await page.getByLabel("Tags").fill("test, easy");

      await page
        .getByRole("dialog")
        .getByRole("button", { name: /^save$/i })
        .click();

      await expect(page.getByText("Workout Saved").first()).toBeVisible();
    });

    test("should save workout with all metadata", async ({ page }) => {
      await page.getByTestId("add-step-button").click();

      await page.getByRole("button", { name: /save to library/i }).click();

      await page.getByLabel("Workout Name").fill("Complete Workout");
      await page.getByLabel("Tags").fill("intervals, hard");
      await page.getByLabel("Difficulty").selectOption("hard");
      await page.getByLabel("Notes").fill("High intensity workout");

      await page
        .getByRole("dialog")
        .getByRole("button", { name: /^save$/i })
        .click();

      await expect(page.getByText("Workout Saved").first()).toBeVisible();
    });

    test("should require workout name", async ({ page }) => {
      await page.getByTestId("add-step-button").click();

      await page.getByRole("button", { name: /save to library/i }).click();
      await page.getByRole("dialog").waitFor({ state: "visible" });

      const saveButton = page
        .getByRole("dialog")
        .getByRole("button", { name: /^save$/i });
      await expect(saveButton).toBeDisabled();
    });
  });

  test.describe("loading workouts (via /library page)", () => {
    test("should load a workout from the library page via 'Load into editor' CTA", async ({
      page,
    }) => {
      // Arrange — save a workout from the editor; the editor still
      // has an active workout so the page CTA appears.
      await page.getByTestId("add-step-button").click();
      await page.getByRole("button", { name: /save to library/i }).click();
      await page.getByLabel("Workout Name").fill("Load Test");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /^save$/i })
        .click();
      await expect(page.getByText("Workout Saved").first()).toBeVisible();
      await page.getByRole("dialog").waitFor({ state: "hidden" });

      // Act — SPA-navigate to the routed Library page via the header
      // button (a `page.goto('/library')` would full-reload and drop
      // the Zustand current-workout state, hiding the CTA). The
      // mobile-aware helper opens the hamburger menu first on small
      // viewports (Pixel 5 / iPhone 12 in Playwright).
      await openHeaderAction(page, /open workout library/i);
      await page.waitForURL(/\/library$/);
      await expect(page.getByTestId("library-page")).toBeVisible();

      const cta = page.getByTestId("card-load-into-editor").first();
      await cta.waitFor({ state: "visible" });
      await cta.click();

      // Assert
      // The CTA loads the template into the store and SPA-navigates
      // to /workout/new?source=scratch — `source=scratch` bypasses
      // the NewWorkoutPicker so the editor mounts directly with the
      // loaded steps.
      await page.waitForURL(/\/workout\/new\?source=scratch$/);
      await expect(page.getByTestId("step-card").first()).toBeVisible();
    });

    test("'Load into editor' CTA is hidden when the editor has no active workout", async ({
      page,
    }) => {
      // Arrange — save a workout, then clear the editor.
      await page.getByTestId("add-step-button").click();
      await page.getByRole("button", { name: /save to library/i }).click();
      await page.getByLabel("Workout Name").fill("Hidden CTA");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /^save$/i })
        .click();
      await expect(page.getByText("Workout Saved").first()).toBeVisible();

      // Visit calendar to navigate away from the editor (the editor
      // store retains the workout, but if we explicitly clear it,
      // the CTA should hide). Using a hard reload to drop in-memory
      // editor state.
      await page.goto("/calendar");
      await page.reload();

      await page.goto("/library");
      await expect(page.getByTestId("library-page")).toBeVisible();
      // After a reload with no editor mount, hasCurrentWorkout is
      // false → the CTA is not rendered.
      await expect(page.getByTestId("card-load-into-editor")).toHaveCount(0);
    });
  });

  test.describe("search and filter (via /library page)", () => {
    test("should search workouts by name", async ({ page }) => {
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

      await page.goto("/library");
      await page.getByPlaceholder(/search workouts/i).fill("morning");

      await expect(
        page.getByRole("heading", { name: "Morning Run" })
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Evening Ride" })
      ).not.toBeVisible();
    });

    test("should filter workouts by tags", async ({ page }) => {
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

      await page.goto("/library");
      await page.getByRole("button", { name: "easy" }).first().click();

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
      await page.getByTestId("add-step-button").click();
      await page.getByRole("button", { name: /save to library/i }).click();
      await page.getByLabel("Workout Name").fill("Test Workout");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /^save$/i })
        .click();
      await expect(page.getByText("Workout Saved").first()).toBeVisible();

      await page.goto("/library");
      await page.getByPlaceholder(/search workouts/i).fill("nonexistent");

      await expect(
        page.getByText(/no workouts match your current filters/i)
      ).toBeVisible();
    });
  });

  test.describe("deleting workouts (via /library page)", () => {
    test("should delete a workout from library", async ({ page }) => {
      await page.getByTestId("add-step-button").click();
      await page.getByRole("button", { name: /save to library/i }).click();
      await page.getByLabel("Workout Name").fill("Delete Me");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /^save$/i })
        .click();
      await expect(page.getByText("Workout Saved").first()).toBeVisible();

      await page.goto("/library");
      await page.getByLabel(/^Delete Delete Me$/i).click();
      await page.getByRole("button", { name: /^delete$/i }).click();

      await expect(
        page.getByRole("heading", { name: "Delete Me" })
      ).not.toBeVisible();
      await expect(page.getByText(/your library is empty/i)).toBeVisible();
    });

    test("should show confirmation before deleting", async ({ page }) => {
      await page.getByTestId("add-step-button").click();
      await page.getByRole("button", { name: /save to library/i }).click();
      await page.getByLabel("Workout Name").fill("Confirm Delete");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /^save$/i })
        .click();
      await expect(page.getByText("Workout Saved").first()).toBeVisible();

      await page.goto("/library");
      await page.getByLabel(/^Delete Confirm Delete$/i).click();

      await expect(page.getByText(/delete workout/i)).toBeVisible();
      await expect(
        page.getByText(/are you sure you want to delete/i)
      ).toBeVisible();
    });

    test("should cancel delete operation", async ({ page }) => {
      await page.getByTestId("add-step-button").click();
      await page.getByRole("button", { name: /save to library/i }).click();
      await page.getByLabel("Workout Name").fill("Keep Me");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /^save$/i })
        .click();
      await expect(page.getByText("Workout Saved").first()).toBeVisible();

      await page.goto("/library");
      await page.getByLabel(/^Delete Keep Me$/i).click();
      await page.getByRole("button", { name: /cancel/i }).click();

      await expect(
        page.getByRole("heading", { name: "Keep Me" })
      ).toBeVisible();
    });
  });

  test.describe("empty state (via /library page)", () => {
    test("should show empty state when no workouts saved", async ({ page }) => {
      await page.goto("/library");

      await expect(page.getByText(/your library is empty/i)).toBeVisible();
      await expect(
        page.getByText(/create your first workout and save it to your library/i)
      ).toBeVisible();
    });
  });
});
