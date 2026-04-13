/**
 * Calendar Batch Processing E2E Tests
 *
 * Batch processing banner visibility, interactions, and edge cases.
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

test.describe("Calendar Batch Processing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/calendar");
    await clearDexie(page);
  });

  test("RAW workouts in week show batch banner with count", async ({
    page,
  }) => {
    const dates = getWeekDates();
    const weekId = getWeekId(dates[0]);

    await seedWorkouts(page, [
      makeRawWorkout(dates[0], "Run 1"),
      makeRawWorkout(dates[1], "Run 2"),
      makeRawWorkout(dates[3], "Ride"),
    ]);
    await page.goto(`/calendar/${weekId}`);

    const banner = page.getByTestId("batch-processing-banner");
    await expect(banner).toBeVisible();
    await expect(banner.getByText("3 raw workouts this week")).toBeVisible();
  });

  test("No RAW workouts hides batch banner", async ({ page }) => {
    const dates = getWeekDates();
    const weekId = getWeekId(dates[0]);

    await seedWorkouts(page, [
      makeWorkout({ date: dates[0], state: "structured" }),
    ]);
    await page.goto(`/calendar/${weekId}`);

    // Wait for calendar to render, then assert banner absent
    await expect(page.getByTestId("calendar-week-grid")).toBeVisible();
    await expect(page.getByTestId("batch-processing-banner")).not.toBeVisible();
  });

  test('Click "Process all" without AI provider shows warning', async ({
    page,
  }) => {
    const dates = getWeekDates();
    const weekId = getWeekId(dates[0]);

    await seedWorkouts(page, [makeRawWorkout(dates[0], "Run")]);
    await page.goto(`/calendar/${weekId}`);

    const banner = page.getByTestId("batch-processing-banner");
    await expect(banner).toBeVisible();

    await banner.getByRole("button", { name: /Process all/i }).click();

    // Without an AI provider, the batch handler shows an inline message
    await expect(
      page.getByText(
        "Configure an AI provider in Settings to process workouts."
      )
    ).toBeVisible({ timeout: 5000 });
  });

  test("Banner disappears when raw workouts are removed from week", async ({
    page,
  }) => {
    const dates = getWeekDates();
    const weekId = getWeekId(dates[0]);
    const workoutId = crypto.randomUUID();

    await seedWorkouts(page, [
      { ...makeRawWorkout(dates[0], "Run"), id: workoutId },
    ]);
    await page.goto(`/calendar/${weekId}`);

    const banner = page.getByTestId("batch-processing-banner");
    await expect(banner).toBeVisible();

    // Remove the raw workout via Dexie
    await page.evaluate(async (id) => {
      const db = (window as unknown as Record<string, unknown>)
        .__KAIORD_DB__ as {
        table: (n: string) => { delete: (k: string) => Promise<void> };
      };
      await db.table("workouts").delete(id);
    }, workoutId);

    // Banner should disappear (useLiveQuery reacts to Dexie changes)
    await expect(banner).not.toBeVisible({ timeout: 5000 });
  });

  test("Single RAW workout shows singular text", async ({ page }) => {
    const dates = getWeekDates();
    const weekId = getWeekId(dates[0]);

    await seedWorkouts(page, [makeRawWorkout(dates[0], "Run")]);
    await page.goto(`/calendar/${weekId}`);

    const banner = page.getByTestId("batch-processing-banner");
    await expect(banner).toBeVisible();
    await expect(banner.getByText("1 raw workout this week")).toBeVisible();
  });
});
