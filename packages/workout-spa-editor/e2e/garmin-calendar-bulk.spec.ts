/**
 * Send week (T7) end to end through the bridge stub's in-memory Garmin
 * account:
 *
 * - AC-43: the stub fails one session; the run continues and places the
 *   others.
 * - AC-44: Retry re-runs only the failed session, and the week ends with
 *   exactly one entry per eligible session.
 * - An outdated bridge fills the library only, with one notice and the
 *   extension's store link.
 */
import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import {
  garminStubActions,
  readGarminStubState,
} from "./helpers/garmin-bridge-stub";
import { seedGarminReadyWorkouts } from "./helpers/garmin-calendar-seed";
import { getWeekDates, makeWorkout } from "./helpers/seed-dexie";

const GARMIN_BRIDGE_STORE_URL =
  "https://chromewebstore.google.com/detail/kaiord-garmin-bridge/innelncjhkdokailkinkchppgekennoe";
const RUN_TIMEOUT_MS = 20_000;
const [MON, , WED, , FRI] = getWeekDates();
const WEEK = [MON, WED, FRI];
const DEADLINE_BEFORE_SEND = {
  response: { ok: false, protocolVersion: 1, error: "deadline-before-send" },
};

const seedWeek = (page: Page, options = {}) =>
  seedGarminReadyWorkouts(
    page,
    WEEK.map((date) => makeWorkout({ date, state: "ready" })),
    options
  );

const panel = (page: Page) =>
  page.getByRole("region", { name: "Send week to Garmin" });

const statuses = (page: Page) => panel(page).getByRole("listitem");

const sendWeek = async (page: Page) => {
  await page.goto("/calendar");
  await page.getByRole("button", { name: "Send week" }).click();
  await expect(panel(page).getByRole("button", { name: "Close" })).toBeVisible({
    timeout: RUN_TIMEOUT_MS,
  });
};

const entryDates = async (page: Page) =>
  ((await readGarminStubState(page))?.entries ?? []).map((e) => e.date).sort();

test.describe("Garmin calendar — send week", () => {
  test("should place the other sessions when one fails, then retry only that one (AC-43, AC-44)", async ({
    page,
  }) => {
    // Arrange
    await seedWeek(page, { failures: { schedule: [DEADLINE_BEFORE_SEND] } });
    await sendWeek(page);
    await expect(statuses(page).nth(0)).toContainText("Failed");
    await expect(statuses(page).nth(1)).toContainText("On its date");
    await expect(statuses(page).nth(2)).toContainText("On its date");
    expect(await entryDates(page)).toEqual([WED, FRI]);
    const before = await garminStubActions(page);

    // Act
    await panel(page).getByRole("button", { name: "Retry" }).click();

    // Assert
    await expect(statuses(page).nth(0)).toContainText("On its date", {
      timeout: RUN_TIMEOUT_MS,
    });
    await expect(panel(page)).toContainText("Placed: 3");
    await expect(statuses(page).nth(1)).toContainText("On its date");
    await expect(statuses(page).nth(2)).toContainText("On its date");
    const retried = (await garminStubActions(page)).slice(before.length);
    expect(retried).toEqual(["schedule"]);
    expect(await entryDates(page)).toEqual(WEEK);
  });

  test("should fill the library with one update notice on an outdated bridge", async ({
    page,
  }) => {
    // Arrange
    await seedWeek(page, { features: null });

    // Act
    await sendWeek(page);

    // Assert
    await expect(statuses(page)).toHaveCount(WEEK.length);
    for (const item of await statuses(page).all())
      await expect(item).toContainText("In your library only");
    const links = panel(page).getByRole("link", {
      name: "Update the extension",
    });
    await expect(links).toHaveCount(1);
    await expect(links).toHaveAttribute("href", GARMIN_BRIDGE_STORE_URL);
    expect(await garminStubActions(page)).toEqual(WEEK.map(() => "push"));
  });
});
