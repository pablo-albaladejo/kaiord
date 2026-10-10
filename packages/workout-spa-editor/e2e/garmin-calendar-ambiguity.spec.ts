/**
 * Ambiguous schedule answers (AC-27, AC-28) end to end through the bridge
 * stub, on the page clock: Garmin's answer is late, or never says whether
 * the entry landed. The calendar is read, never blindly re-POSTed within a
 * run — every case ends with exactly one entry.
 */
import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import {
  garminStubActions,
  type GarminStubOptions,
  readGarminStubState,
} from "./helpers/garmin-bridge-stub";
import {
  openDetailWhenReady,
  seedGarminReadyWorkouts,
} from "./helpers/garmin-calendar-seed";
import { getWeekDates, makeWorkout } from "./helpers/seed-dexie";

/** The SPA's `SETTLE_MS` and `POST_GATE_MS`, passed on the page clock. */
const SETTLE_MS = 3_000;
const POST_GATE_MS = 38_000;
/** Within the bridge's own deadline, so the SPA hears the answer. */
const LATE_ANSWER_MS = 15_000;
const [MON] = getWeekDates();
const ambiguous500 = (commit: boolean) => ({
  response: {
    ok: false,
    protocolVersion: 1,
    error: "Schedule failed",
    status: 500,
  },
  commit,
});

const sendButton = (page: Page) =>
  page.getByRole("button", { name: "Send to Garmin" });

/** A ready workout on the page clock, opened on its detail page and sent. */
const sendReadyWorkout = async (page: Page, options: GarminStubOptions) => {
  await page.clock.install();
  const workoutId = crypto.randomUUID();
  await seedGarminReadyWorkouts(
    page,
    [makeWorkout({ id: workoutId, date: MON, state: "ready" })],
    options
  );
  await openDetailWhenReady(page, workoutId);
  await sendButton(page).click();
  await expect.poll(() => garminStubActions(page)).toContain("schedule");
};

const scheduleCalls = async (page: Page) =>
  (await garminStubActions(page)).filter((a) => a === "schedule").length;

const entryCount = async (page: Page) =>
  (await readGarminStubState(page))?.entries.length ?? 0;

test.describe("Garmin calendar — ambiguous answers", () => {
  test("should place once when Garmin answers late (AC-28)", async ({
    page,
  }) => {
    // Arrange
    await sendReadyWorkout(page, { delays: { schedule: LATE_ANSWER_MS } });

    // Act
    await page.clock.fastForward(LATE_ANSWER_MS);

    // Assert
    await expect(page.getByText("On your Garmin calendar on")).toBeVisible();
    await page.clock.fastForward(POST_GATE_MS);
    expect(await scheduleCalls(page)).toBe(1);
    expect(await entryCount(page)).toBe(1);
  });

  test("should adopt an entry Garmin created without confirming it (AC-28)", async ({
    page,
  }) => {
    // Arrange
    await sendReadyWorkout(page, {
      failures: { schedule: [ambiguous500(true)] },
    });

    // Act
    await page.clock.fastForward(SETTLE_MS);

    // Assert
    await expect(page.getByText("On your Garmin calendar on")).toBeVisible();
    expect(await garminStubActions(page)).toContain("calendar-find");
    expect(await scheduleCalls(page)).toBe(1);
    expect(await entryCount(page)).toBe(1);
  });

  test("should let the athlete send anyway after the gate and place once (AC-27)", async ({
    page,
  }) => {
    // Arrange
    await sendReadyWorkout(page, {
      failures: { schedule: [ambiguous500(false)] },
    });
    await page.clock.fastForward(SETTLE_MS);
    await expect(
      page.getByText("Garmin did not confirm the entry")
    ).toBeVisible();
    expect(await entryCount(page)).toBe(0);

    // Act
    await page.clock.fastForward(POST_GATE_MS);
    await page.getByRole("button", { name: "Send anyway" }).click();

    // Assert
    await expect(page.getByText("On your Garmin calendar on")).toBeVisible();
    expect(await scheduleCalls(page)).toBe(2);
    expect(await entryCount(page)).toBe(1);
  });
});
