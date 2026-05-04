/**
 * Library-Calendar Integration E2E Tests
 *
 * Library page, template display, schedule-to-calendar flow.
 */

import { expect, test } from "./fixtures/base";
import { openHeaderAction } from "./helpers/mobile-menu";
import {
  clearDexie,
  getWeekDates,
  getWeekId,
  makeTemplate,
  makeWorkout,
  seedTemplates,
  seedWorkouts,
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

  test('Header "Library" button navigates to /library page (no modal)', async ({
    page,
  }) => {
    await page.goto("/calendar");

    // Per surface-classification rule, Library is a routed page —
    // the header click navigates, it does not open a modal.
    await openHeaderAction(page, /open workout library/i);
    await page.waitForURL(/\/library$/);

    await expect(page.getByTestId("library-page")).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test('Empty day "Add from Library" opens the in-flow picker (no navigation)', async ({
    page,
  }) => {
    const dates = getWeekDates();
    const weekId = getWeekId(dates[0]);

    // Ensure we have at least one workout so it's not FirstVisitState
    await seedWorkouts(page, [
      makeWorkout({ date: dates[0], state: "structured" }),
    ]);
    await seedTemplates(page, [makeTemplate({ name: "Z2 Ride" })]);
    await page.goto(`/calendar/${weekId}`);

    // Click empty day (day 1 has no workouts)
    const btn = page.getByTestId(`empty-day-${dates[1]}`);
    await btn.scrollIntoViewIfNeeded();
    await btn.click({ force: true });
    await expect(page.getByTestId("empty-day-dialog")).toBeVisible();

    await page.getByRole("button", { name: /Add from Library/i }).click();

    await expect(page.getByTestId("template-picker-dialog")).toBeVisible();
    // URL must NOT have navigated to the page route.
    expect(page.url()).toMatch(new RegExp(`/calendar/${weekId}$`));
  });
});
