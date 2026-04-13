/**
 * Calendar Empty States E2E Tests
 *
 * First visit, empty week, and entry-path actions.
 */

import { expect, test } from "./fixtures/base";
import {
  clearDexie,
  getWeekDates,
  getWeekId,
  makeWorkout,
  seedWorkouts,
} from "./helpers/seed-dexie";

test.describe("Calendar Empty States", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/calendar");
    await clearDexie(page);
  });

  test("No workouts shows FirstVisitState", async ({ page }) => {
    await page.reload();

    await expect(page.getByTestId("first-visit-state")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("Welcome to Kaiord")).toBeVisible();
  });

  test("FirstVisitState still shows week grid below", async ({ page }) => {
    await page.reload();

    await expect(page.getByTestId("first-visit-state")).toBeVisible();
    await expect(page.getByTestId("calendar-week-grid")).toBeVisible();
  });

  test('FirstVisitState "Create" navigates to /workout/new', async ({
    page,
  }) => {
    await page.reload();

    await expect(page.getByTestId("first-visit-state")).toBeVisible();
    await page.getByRole("button", { name: "Create" }).click();
    await page.waitForURL(/\/workout\/new/);
  });

  test('FirstVisitState "Import" navigates to /workout/new?action=import', async ({
    page,
  }) => {
    await page.reload();

    await expect(page.getByTestId("first-visit-state")).toBeVisible();
    await page.getByRole("button", { name: "Import" }).click();
    await page.waitForURL(/\/workout\/new\?action=import/);
  });

  test('FirstVisitState "Connect" opens Settings dialog', async ({ page }) => {
    await page.reload();

    await expect(page.getByTestId("first-visit-state")).toBeVisible();
    await page.getByRole("button", { name: "Connect" }).click();

    // Settings dialog should appear
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("Workouts in other week but not this shows EmptyWeekState", async ({
    page,
  }) => {
    // Seed a workout in a different week (2 weeks ago)
    const otherWeekDates = getWeekDates(-2);
    await seedWorkouts(page, [
      makeWorkout({ date: otherWeekDates[0], state: "structured" }),
    ]);
    await page.reload();

    // Current week should show EmptyWeekState (not FirstVisitState)
    await expect(page.getByTestId("empty-week-state")).toBeVisible();
    await expect(page.getByText("No workouts this week")).toBeVisible();
    await expect(page.getByTestId("first-visit-state")).not.toBeVisible();
  });

  test('EmptyWeekState "Go to latest" navigates to correct week', async ({
    page,
  }) => {
    const otherWeekDates = getWeekDates(-2);
    const expectedWeekId = getWeekId(otherWeekDates[0]);

    await seedWorkouts(page, [
      makeWorkout({ date: otherWeekDates[0], state: "structured" }),
    ]);
    await page.reload();

    await expect(page.getByTestId("empty-week-state")).toBeVisible();
    await page.getByRole("button", { name: /Go to latest/i }).click();
    await page.waitForURL(new RegExp(`/calendar/${expectedWeekId}`));
  });

  test('EmptyWeekState "Add workout" navigates to /workout/new', async ({
    page,
  }) => {
    const otherWeekDates = getWeekDates(-2);
    await seedWorkouts(page, [
      makeWorkout({ date: otherWeekDates[0], state: "structured" }),
    ]);
    await page.reload();

    await expect(page.getByTestId("empty-week-state")).toBeVisible();
    await page.getByRole("button", { name: /Add workout/i }).click();
    await page.waitForURL(/\/workout\/new/);
  });
});
