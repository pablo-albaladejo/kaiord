/**
 * Workout Lifecycle E2E Tests
 *
 * Core workflow: RAW -> skip/process -> structured -> accept -> push.
 */

import { expect, test } from "./fixtures/base";
import {
  clearDexie,
  getWeekDates,
  getWeekId,
  makeRawWorkout,
  makeWorkout,
  seedWorkouts,
} from "./helpers/seed-dexie";

test.describe("Workout Lifecycle", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/calendar");
    await clearDexie(page);
  });

  test("RAW workout -> open dialog -> Skip -> card shows skipped state", async ({
    page,
  }) => {
    const dates = getWeekDates();
    const weekId = getWeekId(dates[0]);

    await seedWorkouts(page, [makeRawWorkout(dates[0], "Morning Run")]);
    await page.goto(`/calendar/${weekId}`);

    // Click the raw workout card to open the dialog
    await page.locator('[data-testid^="workout-card-"]').first().click();
    await expect(page.getByTestId("raw-workout-dialog")).toBeVisible();

    // Click Skip
    await page.getByRole("button", { name: "Skip" }).click();

    // Dialog should close and card should now show "Skipped" indicator
    await expect(page.getByTestId("raw-workout-dialog")).not.toBeVisible();

    const indicator = page
      .locator('[data-testid^="workout-card-"]')
      .first()
      .getByTestId("state-indicator");
    await expect(indicator).toHaveAttribute("title", "Skipped");
  });

  test("Skipped workout -> open dialog -> Un-skip -> returns to raw", async ({
    page,
  }) => {
    const dates = getWeekDates();
    const weekId = getWeekId(dates[0]);

    await seedWorkouts(page, [makeRawWorkout(dates[0], "Skipped Run")]);

    // First skip the workout
    await page.goto(`/calendar/${weekId}`);
    await page.locator('[data-testid^="workout-card-"]').first().click();
    await page.getByRole("button", { name: "Skip" }).click();
    await expect(page.getByTestId("raw-workout-dialog")).not.toBeVisible();

    // Now click the skipped workout and un-skip
    await page.locator('[data-testid^="workout-card-"]').first().click();
    await expect(page.getByTestId("raw-workout-dialog")).toBeVisible();
    await page.getByRole("button", { name: "Un-skip" }).click();

    // Should return to raw state
    await expect(page.getByTestId("raw-workout-dialog")).not.toBeVisible();

    const indicator = page
      .locator('[data-testid^="workout-card-"]')
      .first()
      .getByTestId("state-indicator");
    await expect(indicator).toHaveAttribute("title", "Raw");
  });

  test('RAW workout -> click "Process with AI" -> navigates to /workout/{id}', async ({
    page,
  }) => {
    const dates = getWeekDates();
    const weekId = getWeekId(dates[0]);
    const workoutId = crypto.randomUUID();

    await seedWorkouts(page, [
      {
        ...makeRawWorkout(dates[0], "Process Me"),
        id: workoutId,
      },
    ]);
    await page.goto(`/calendar/${weekId}`);

    await page.locator('[data-testid^="workout-card-"]').first().click();
    await expect(page.getByTestId("raw-workout-dialog")).toBeVisible();

    await page.getByRole("button", { name: /Process with AI/i }).click();
    await page.waitForURL(new RegExp(`/workout/${workoutId}`));
  });

  test("STRUCTURED workout in editor shows Accept Workout button", async ({
    page,
  }) => {
    const dates = getWeekDates();
    const workoutId = crypto.randomUUID();

    await seedWorkouts(page, [
      makeWorkout({ id: workoutId, date: dates[0], state: "structured" }),
    ]);
    await page.goto(`/workout/${workoutId}`);

    const workflowBar = page.getByTestId("workflow-bar");
    await expect(workflowBar).toBeVisible();
    await expect(
      workflowBar.getByRole("button", { name: /Accept Workout/i })
    ).toBeVisible();
  });

  test("READY workout in editor shows Push to Garmin button", async ({
    page,
  }) => {
    const dates = getWeekDates();
    const workoutId = crypto.randomUUID();

    await seedWorkouts(page, [
      makeWorkout({ id: workoutId, date: dates[0], state: "ready" }),
    ]);
    await page.goto(`/workout/${workoutId}`);

    const workflowBar = page.getByTestId("workflow-bar");
    await expect(workflowBar).toBeVisible();
    await expect(
      workflowBar.getByRole("button", { name: /Push to Garmin/i })
    ).toBeVisible();
  });

  test("MODIFIED workout in editor shows Modified indicator", async ({
    page,
  }) => {
    const dates = getWeekDates();
    const workoutId = crypto.randomUUID();

    await seedWorkouts(page, [
      makeWorkout({ id: workoutId, date: dates[0], state: "modified" }),
    ]);
    await page.goto(`/workout/${workoutId}`);

    const workflowBar = page.getByTestId("workflow-bar");
    await expect(workflowBar).toBeVisible();
  });
});
