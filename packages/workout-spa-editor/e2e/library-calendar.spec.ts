/**
 * Library-Calendar Integration E2E Tests
 *
 * Library page, template display, schedule-to-calendar flow.
 */

import { expect, test } from "./fixtures/base";
import {
  clearDexie,
  getWeekDates,
  getWeekId,
  makeTemplate,
  seedTemplates,
  seedWorkouts,
  makeWorkout,
} from "./helpers/seed-dexie";

test.describe("Library-Calendar Integration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/calendar");
    await clearDexie(page);
  });

  test("/library route shows library page", async ({ page }) => {
    await page.goto("/library");
    await expect(page.getByTestId("library-page")).toBeVisible();
  });

  test("Library page shows seeded templates", async ({ page }) => {
    await seedTemplates(page, [
      makeTemplate({ name: "Tempo Run" }),
      makeTemplate({ name: "Endurance Ride" }),
    ]);
    await page.goto("/library");

    await expect(page.getByText("Tempo Run")).toBeVisible();
    await expect(page.getByText("Endurance Ride")).toBeVisible();
  });

  test("Schedule button on template opens date picker dialog", async ({
    page,
  }) => {
    await seedTemplates(page, [makeTemplate({ name: "FTP Test" })]);
    await page.goto("/library");

    await expect(page.getByText("FTP Test")).toBeVisible();

    // Click the Schedule button on the template card
    await page
      .getByRole("button", { name: /Schedule/i })
      .first()
      .click();

    // The schedule date dialog should appear
    await expect(page.getByTestId("schedule-date-input")).toBeVisible();
    await expect(page.getByText("Schedule Workout")).toBeVisible();
  });

  test("Pick date and confirm creates workout on calendar", async ({
    page,
  }) => {
    const dates = getWeekDates();
    const targetDate = dates[3]; // Thursday
    const weekId = getWeekId(targetDate);

    await seedTemplates(page, [makeTemplate({ name: "Recovery Spin" })]);
    await page.goto("/library");

    await expect(page.getByText("Recovery Spin")).toBeVisible();
    await page
      .getByRole("button", { name: /Schedule/i })
      .first()
      .click();
    await expect(page.getByTestId("schedule-date-input")).toBeVisible();

    // Set the date
    await page.getByTestId("schedule-date-input").fill(targetDate);

    // Confirm schedule via the dialog button
    const dialog = page.locator('[role="dialog"]');
    await dialog.getByRole("button", { name: /Schedule/i }).click();

    // Wait for the dialog to close (confirms Dexie write completed)
    await expect(dialog).not.toBeVisible();

    // Navigate to the calendar to verify the workout was created
    await page.goto(`/calendar/${weekId}`);
    await page.waitForSelector('[data-testid^="workout-card-"]');

    const thursdayCol = page.getByTestId(`day-column-${targetDate}`);
    await expect(
      thursdayCol.locator('[data-testid^="workout-card-"]')
    ).toHaveCount(1);
  });

  test('Header "Library" button opens dialog (distinct from /library page)', async ({
    page,
  }) => {
    await page.goto("/calendar");

    // The header Library button opens the dialog overlay, not the route
    await page.getByRole("button", { name: "Open workout library" }).click();

    await expect(page.getByRole("dialog")).toBeVisible();
    // We should still be on /calendar, not /library
    expect(page.url()).toContain("/calendar");
  });

  test('Empty day "Add from Library" navigates to /library', async ({
    page,
  }) => {
    const dates = getWeekDates();
    const weekId = getWeekId(dates[0]);

    // Ensure we have at least one workout so it's not FirstVisitState
    await seedWorkouts(page, [
      makeWorkout({ date: dates[0], state: "structured" }),
    ]);
    await page.goto(`/calendar/${weekId}`);

    // Click empty day (day 1 has no workouts)
    const btn = page.getByTestId(`empty-day-${dates[1]}`);
    await btn.scrollIntoViewIfNeeded();
    await btn.click({ force: true });
    await expect(page.getByTestId("empty-day-dialog")).toBeVisible();

    await page.getByRole("button", { name: /Add from Library/i }).click();
    await page.waitForURL(/\/library/);
  });
});
