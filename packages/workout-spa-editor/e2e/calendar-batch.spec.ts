/**
 * Calendar Batch Processing E2E Tests
 *
 * Batch processing banner visibility, interactions, and edge cases.
 */

import { expect, test } from "./fixtures/base";
import { seedAiProvider } from "./helpers/seed-ai-provider";
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

    await seedAiProvider(page);
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

  test("Raw workouts without an AI provider offer the fix, not a dead end", async ({
    page,
  }) => {
    const dates = getWeekDates();
    const weekId = getWeekId(dates[0]);

    await seedWorkouts(page, [makeRawWorkout(dates[0], "Run")]);
    await page.goto(`/calendar/${weekId}`);

    // The week gets exactly one action for its raw sessions. With no key the
    // batch button could only ever fail, so the banner that names the
    // consequence takes its place (principle 4 — the CTA is the fix).
    await expect(page.getByTestId("no-ai-provider-state")).toBeVisible();
    await expect(page.getByTestId("batch-processing-banner")).not.toBeVisible();

    await page.getByRole("button", { name: "Add an AI key" }).click();
    await page.waitForURL(/\/settings\/ai/);
  });

  test("Banner disappears when raw workouts are removed from week", async ({
    page,
  }) => {
    const dates = getWeekDates();
    const weekId = getWeekId(dates[0]);
    const workoutId = crypto.randomUUID();

    await seedAiProvider(page);
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

    await seedAiProvider(page);
    await seedWorkouts(page, [makeRawWorkout(dates[0], "Run")]);
    await page.goto(`/calendar/${weekId}`);

    const banner = page.getByTestId("batch-processing-banner");
    await expect(banner).toBeVisible();
    await expect(banner.getByText("1 raw workout this week")).toBeVisible();
  });
});
