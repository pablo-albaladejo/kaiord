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

const TWO_WEEKS_AGO = -2;

test.describe("Calendar Empty States", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/calendar");
    await clearDexie(page);
  });

  test("should render the week grid without a welcome card when no workouts exist", async ({
    page,
  }) => {
    // Arrange
    // PR header-zones-and-picker removed FirstVisitState. The calendar
    // now relies on the persistent header (`+ New workout`, Library,
    // Profile) for empty-state discoverability. The week grid still
    // renders so the user can scan upcoming days.

    // Act

    await page.reload();

    // Assert

    await expect(page.getByTestId("first-visit-state")).not.toBeAttached();
    await expect(page.getByText("Welcome to Kaiord")).not.toBeAttached();
    await expect(page.getByTestId("calendar-week-grid")).toBeVisible();
  });

  test("Workouts in other week but not this shows EmptyWeekState", async ({
    page,
  }) => {
    // Seed a workout in a different week (2 weeks ago)
    const otherWeekDates = getWeekDates(TWO_WEEKS_AGO);
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
    const otherWeekDates = getWeekDates(TWO_WEEKS_AGO);
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
    const otherWeekDates = getWeekDates(TWO_WEEKS_AGO);
    await seedWorkouts(page, [
      makeWorkout({ date: otherWeekDates[0], state: "structured" }),
    ]);
    await page.reload();

    await expect(page.getByTestId("empty-week-state")).toBeVisible();
    await page.getByRole("button", { name: /Add workout/i }).click();
    await page.waitForURL(/\/workout\/new/);
  });
});
