/**
 * Moving a pushed workout (T5, T6) end to end through the bridge stub's
 * in-memory Garmin account: the next push schedules the new date and
 * removes the old entry (sent from the workout detail page) — one entry,
 * never a gap. The date changes while the page is open, as a coach sync
 * does. When Garmin refuses the removal, the athlete is told an older entry
 * is still there.
 */
import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import {
  garminStubActions,
  type GarminStubOptions,
  readGarminStubState,
} from "./helpers/garmin-bridge-stub";
import {
  moveWorkoutDate,
  openDetailWhenReady,
  seedGarminReadyWorkouts,
} from "./helpers/garmin-calendar-seed";
import { getWeekDates, makeWorkout } from "./helpers/seed-dexie";

const PLACEMENT_TIMEOUT_MS = 20_000;
const [MON, , WED] = getWeekDates();
const UNSCHEDULE_500 = {
  response: {
    ok: false,
    protocolVersion: 1,
    error: "Unschedule failed",
    status: 500,
  },
};

const SENT_CLAIM = "On your Garmin calendar on";

const send = (page: Page) =>
  page.getByRole("button", { name: "Send to Garmin" }).click();

const entryDates = async (page: Page) =>
  ((await readGarminStubState(page))?.entries ?? []).map((e) => e.date);

/** A workout pushed on Monday, then moved to Wednesday. */
const pushThenMove = async (page: Page, options: GarminStubOptions = {}) => {
  const workoutId = crypto.randomUUID();
  await seedGarminReadyWorkouts(
    page,
    [makeWorkout({ id: workoutId, date: MON, state: "ready" })],
    options
  );
  await openDetailWhenReady(page, workoutId);
  await send(page);
  await expect
    .poll(() => entryDates(page), { timeout: PLACEMENT_TIMEOUT_MS })
    .toEqual([MON]);
  await expect(page.getByText(SENT_CLAIM)).toBeVisible();
  // In-app: the open page sees the new date with no reload.
  await moveWorkoutDate(page, workoutId, WED);
  await expect(page.getByText(SENT_CLAIM)).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Send to Garmin" })
  ).toBeEnabled();
};

test.describe("Garmin calendar — move", () => {
  test("should move the Garmin entry to the new date on the next push", async ({
    page,
  }) => {
    // Arrange
    await pushThenMove(page);

    // Act
    await send(page);

    // Assert
    await expect(page.getByText("Moved on your Garmin calendar")).toBeVisible({
      timeout: PLACEMENT_TIMEOUT_MS,
    });
    expect(await entryDates(page)).toEqual([WED]);
    // One library push; the move schedules the new date, then reads the
    // calendar before it removes the old entry. Extra verify reads are fine.
    const actions = await garminStubActions(page);
    const count = (action: string) =>
      actions.filter((a) => a === action).length;
    expect([count("push"), count("schedule"), count("unschedule")]).toEqual([
      1, 2, 1,
    ]);
    const moved = actions.lastIndexOf("schedule");
    const removed = actions.indexOf("unschedule");
    expect(moved).toBeLessThan(removed);
    expect(actions.slice(moved, removed)).toContain("calendar-find");
  });

  test("should warn that the old entry is still there when its removal fails", async ({
    page,
  }) => {
    // Arrange
    await pushThenMove(page, { failures: { unschedule: [UNSCHEDULE_500] } });

    // Act
    await send(page);

    // Assert
    await expect(page.getByText("an older entry is still on")).toBeVisible({
      timeout: PLACEMENT_TIMEOUT_MS,
    });
    expect((await entryDates(page)).sort()).toEqual([MON, WED]);
  });
});
