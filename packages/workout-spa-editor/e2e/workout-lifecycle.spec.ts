/**
 * Workout Lifecycle E2E Tests
 *
 * Core workflow: RAW -> skip/process -> structured -> send. The verb cut
 * removed the Accept step: sending performs the ready transition as part of
 * the one send, and the EditorStateRibbon is the only surface that can reach
 * the watch.
 */

import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import { installGarminBridgeStub } from "./helpers/garmin-bridge-stub";
import { seedEnabledGarminExportPolicy } from "./helpers/garmin-ready-gate";
import {
  clearDexie,
  E2E_DEFAULT_PROFILE_ID,
  getWeekDates,
  getWeekId,
  makeRawWorkout,
  makeWorkout,
  seedDefaultProfile,
  seedWorkouts,
} from "./helpers/seed-dexie";

test.describe("Workout Lifecycle", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/calendar");
    await clearDexie(page);
    await seedDefaultProfile(page);
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
    await expect(indicator).toHaveText("Skipped");
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
    await expect(indicator).toHaveText("Raw");
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

  /** The ribbon renders the send only behind the full ready gate:
      extension + session (the stub) and an enabled export policy. */
  const openWithReadyGate = async (page: Page, state: string) => {
    const workoutId = crypto.randomUUID();
    await seedEnabledGarminExportPolicy(page, E2E_DEFAULT_PROFILE_ID);
    await seedWorkouts(page, [
      makeWorkout({ id: workoutId, date: getWeekDates()[0], state }),
    ]);
    await page.goto(`/workout/${workoutId}`);
    return workoutId;
  };

  test("STRUCTURED workout offers the send directly, with no Accept step", async ({
    page,
  }) => {
    await installGarminBridgeStub(page);
    await page.goto("/calendar");
    await clearDexie(page);
    await seedDefaultProfile(page);
    await openWithReadyGate(page, "structured");

    const ribbon = page.getByTestId("editor-state-ribbon");
    await expect(ribbon).toBeVisible();
    await expect(ribbon).toContainText("Ready to send to your watch");
    await expect(ribbon.getByTestId("send-to-garmin-button")).toBeVisible();
    // The verb cut: accepting is folded into the send.
    await expect(
      page.getByRole("button", { name: /Accept Workout/i })
    ).toHaveCount(0);
  });

  test("READY workout offers the same single send", async ({ page }) => {
    await installGarminBridgeStub(page);
    await page.goto("/calendar");
    await clearDexie(page);
    await seedDefaultProfile(page);
    await openWithReadyGate(page, "ready");

    const ribbon = page.getByTestId("editor-state-ribbon");
    await expect(ribbon).toBeVisible();
    await expect(ribbon).toContainText("Ready to send to your watch");
    await expect(ribbon.getByTestId("send-to-garmin-button")).toBeVisible();
  });

  test("MODIFIED workout names the staleness and offers the send", async ({
    page,
  }) => {
    await installGarminBridgeStub(page);
    await page.goto("/calendar");
    await clearDexie(page);
    await seedDefaultProfile(page);
    await openWithReadyGate(page, "modified");

    const ribbon = page.getByTestId("editor-state-ribbon");
    await expect(ribbon).toBeVisible();
    await expect(ribbon).toContainText(
      "Your watch still has the version from before these edits"
    );
    await expect(ribbon.getByTestId("send-to-garmin-button")).toBeVisible();
  });

  test("PUSHED workout renders no ribbon: the watch already has this version", async ({
    page,
  }) => {
    await installGarminBridgeStub(page);
    await page.goto("/calendar");
    await clearDexie(page);
    await seedDefaultProfile(page);
    await openWithReadyGate(page, "pushed");

    await expect(page.getByTestId("editor-canvas")).toBeVisible();
    await expect(page.getByTestId("editor-state-ribbon")).toHaveCount(0);
  });
});
