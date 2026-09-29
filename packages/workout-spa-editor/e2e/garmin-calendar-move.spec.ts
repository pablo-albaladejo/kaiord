/**
 * Moving a pushed workout (T5, T6) end to end through the bridge stub's
 * in-memory Garmin account: the next push schedules the new date and
 * removes the old entry (sent from the workout detail page) — one entry, never a gap. When Garmin refuses the
 * removal, the athlete is told an older entry is still there.
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
  await moveWorkoutDate(page, workoutId, WED);
  await openDetailWhenReady(page, workoutId);
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
    const actions = await garminStubActions(page);
    expect(actions.filter((a) => a === "push")).toHaveLength(1);
    expect(actions.filter((a) => a === "unschedule")).toHaveLength(1);
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
