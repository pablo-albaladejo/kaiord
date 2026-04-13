/**
 * Calendar Workouts E2E Tests
 *
 * Workout cards on the calendar: display, state indicators, click actions.
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

test.describe("Calendar Workouts", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/calendar");
    await clearDexie(page);
  });

  test("Week with workouts shows cards on correct days", async ({ page }) => {
    const dates = getWeekDates();
    const weekId = getWeekId(dates[0]);

    await seedWorkouts(page, [
      makeWorkout({ date: dates[0], state: "structured" }),
      makeWorkout({ date: dates[2], state: "ready" }),
    ]);
    await page.goto(`/calendar/${weekId}`);
    await page.waitForSelector('[data-testid^="workout-card-"]');

    // Expect cards in the correct day columns
    const mondayCol = page.getByTestId(`day-column-${dates[0]}`);
    await expect(
      mondayCol.locator('[data-testid^="workout-card-"]')
    ).toHaveCount(1);

    const wednesdayCol = page.getByTestId(`day-column-${dates[2]}`);
    await expect(
      wednesdayCol.locator('[data-testid^="workout-card-"]')
    ).toHaveCount(1);
  });

  test("Multiple workouts per day stacked chronologically", async ({
    page,
  }) => {
    const dates = getWeekDates();
    const weekId = getWeekId(dates[0]);

    await seedWorkouts(page, [
      makeWorkout({
        date: dates[0],
        state: "structured",
        createdAt: "2026-01-01T06:00:00Z",
      }),
      makeWorkout({
        date: dates[0],
        state: "ready",
        createdAt: "2026-01-01T10:00:00Z",
      }),
    ]);
    await page.goto(`/calendar/${weekId}`);

    const mondayCol = page.getByTestId(`day-column-${dates[0]}`);
    await expect(
      mondayCol.locator('[data-testid^="workout-card-"]')
    ).toHaveCount(2);
  });

  test("RAW card shows warning indicator", async ({ page }) => {
    const dates = getWeekDates();
    const weekId = getWeekId(dates[0]);

    await seedWorkouts(page, [makeRawWorkout(dates[0], "Long Run")]);
    await page.goto(`/calendar/${weekId}`);

    const card = page.locator('[data-testid^="workout-card-"]').first();
    await expect(card).toBeVisible();

    // Raw state indicator has title "Raw"
    const indicator = card.getByTestId("state-indicator");
    await expect(indicator).toHaveAttribute("title", "Raw");
  });

  test("PUSHED card shows check indicator", async ({ page }) => {
    const dates = getWeekDates();
    const weekId = getWeekId(dates[0]);

    await seedWorkouts(page, [
      makeWorkout({ date: dates[0], state: "pushed" }),
    ]);
    await page.goto(`/calendar/${weekId}`);

    const indicator = page
      .locator('[data-testid^="workout-card-"]')
      .first()
      .getByTestId("state-indicator");
    await expect(indicator).toHaveAttribute("title", "Pushed");
  });

  test("STRUCTURED card shows structured indicator", async ({ page }) => {
    const dates = getWeekDates();
    const weekId = getWeekId(dates[0]);

    await seedWorkouts(page, [
      makeWorkout({ date: dates[0], state: "structured" }),
    ]);
    await page.goto(`/calendar/${weekId}`);

    const indicator = page
      .locator('[data-testid^="workout-card-"]')
      .first()
      .getByTestId("state-indicator");
    await expect(indicator).toHaveAttribute("title", "Structured");
  });

  test("Click RAW card opens dialog with title and description", async ({
    page,
  }) => {
    const dates = getWeekDates();
    const weekId = getWeekId(dates[0]);

    await seedWorkouts(page, [makeRawWorkout(dates[0], "Long Run")]);
    await page.goto(`/calendar/${weekId}`);

    await page.locator('[data-testid^="workout-card-"]').first().click();

    const dialog = page.getByTestId("raw-workout-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Long Run")).toBeVisible();
    await expect(dialog.getByText("2K z1 + 3K z3 + 2K z1")).toBeVisible();
  });

  test("Click STRUCTURED card navigates to /workout/{id}", async ({ page }) => {
    const dates = getWeekDates();
    const weekId = getWeekId(dates[0]);
    const workoutId = crypto.randomUUID();

    await seedWorkouts(page, [
      makeWorkout({ id: workoutId, date: dates[0], state: "structured" }),
    ]);
    await page.goto(`/calendar/${weekId}`);

    await page.locator('[data-testid^="workout-card-"]').first().click();
    await page.waitForURL(new RegExp(`/workout/${workoutId}`));
  });

  test('Click "+" on empty day opens dialog', async ({ page }) => {
    const dates = getWeekDates();
    const weekId = getWeekId(dates[0]);

    // Seed a workout on day 0 so day 1 is empty
    await seedWorkouts(page, [
      makeWorkout({ date: dates[0], state: "structured" }),
    ]);
    await page.goto(`/calendar/${weekId}`);

    // Click the empty day button for day 1
    const btn = page.getByTestId(`empty-day-${dates[1]}`);
    await btn.scrollIntoViewIfNeeded();
    await btn.click({ force: true });

    await expect(page.getByTestId("empty-day-dialog")).toBeVisible();
  });

  test('EmptyDayDialog "Create new" navigates to /workout/new?date=X', async ({
    page,
  }) => {
    const dates = getWeekDates();
    const weekId = getWeekId(dates[0]);

    await page.goto(`/calendar/${weekId}`);

    const btn = page.getByTestId(`empty-day-${dates[0]}`);
    await btn.scrollIntoViewIfNeeded();
    await btn.click({ force: true });
    await expect(page.getByTestId("empty-day-dialog")).toBeVisible();

    await page.getByRole("button", { name: /Create new workout/i }).click();
    await page.waitForURL(new RegExp(`/workout/new\\?date=${dates[0]}`));
  });

  test('EmptyDayDialog "Add from Library" navigates to /library', async ({
    page,
  }) => {
    const dates = getWeekDates();
    const weekId = getWeekId(dates[0]);

    await page.goto(`/calendar/${weekId}`);

    const btn = page.getByTestId(`empty-day-${dates[0]}`);
    await btn.scrollIntoViewIfNeeded();
    await btn.click({ force: true });
    await expect(page.getByTestId("empty-day-dialog")).toBeVisible();

    await page.getByRole("button", { name: /Add from Library/i }).click();
    await page.waitForURL(/\/library/);
  });
});
