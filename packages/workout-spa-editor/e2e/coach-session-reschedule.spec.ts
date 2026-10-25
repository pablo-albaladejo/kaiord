/**
 * Coach-session reschedule end to end (design §Test plan PR-4, AC-22): a
 * Train2Go plan synced through the bridge stub and converted by hand, on a
 * fresh profile with no Garmin bridge, on a frozen clock in a fixed week.
 * Between syncs the stub's coach moves the session (same id, new date).
 */
import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import { GRID_MIN_WIDTH } from "./helpers/calendar-day";
import {
  DAY,
  dayColumn,
  matchedCard,
  NOW,
  planOn,
  seedCoachProfile,
  WEEK_1,
  WEEK_2,
} from "./helpers/coach-session-flow";
import {
  moveThroughDialog,
  readSession,
  resyncWeek,
  syncAndConvert,
} from "./helpers/coach-session-steps";
import { clearDexie } from "./helpers/seed-dexie";
import { installTrain2GoBridgeStub } from "./helpers/train2go-bridge-stub";
import { setStubWeekActivities } from "./helpers/train2go-stub-week";
import { waitForDexieReady } from "./helpers/wait-for-dexie-ready";

const PROFILE_ID = "coach-reschedule-profile";
/** The re-sync's instant: an hour after the first sync. */
const LATER = `${DAY.TUE}T09:00:00Z`;

/** The notice a sync shows when it moved a session to the coach's date. */
const coachNotice = (page: Page) =>
  page.getByRole("status").filter({ hasText: /coach's new date/ });

const setup = async (page: Page, planDay: string) => {
  await page.clock.setFixedTime(new Date(NOW));
  await installTrain2GoBridgeStub(page, { weekActivities: [planOn(planDay)] });
  await page.goto("/calendar");
  await waitForDexieReady(page);
  await clearDexie(page);
  await seedCoachProfile(page, PROFILE_ID);
};

test.describe("Coach session reschedule", () => {
  test("should keep the athlete's day when the coach's week is unchanged", async ({
    page,
  }) => {
    // Arrange
    await setup(page, DAY.TUE);
    const card = await syncAndConvert(page, WEEK_1);
    await moveThroughDialog(page, card, DAY.THU);
    await expect(dayColumn(page, DAY.THU).locator(card)).toBeVisible({
      timeout: 10_000,
    });

    // Act
    await resyncWeek(page, WEEK_1, LATER);

    // Assert
    await expect
      .poll(() => readSession(page))
      .toEqual({ workout: DAY.THU, match: DAY.THU });
    await expect(dayColumn(page, DAY.THU).locator(card)).toBeVisible();
    await expect(coachNotice(page)).toHaveCount(0);
  });

  test("should follow the coach over the athlete's day and move it back on request", async ({
    page,
  }) => {
    // Arrange
    await setup(page, DAY.TUE);
    const card = await syncAndConvert(page, WEEK_1);
    await moveThroughDialog(page, card, DAY.THU);
    await expect(dayColumn(page, DAY.THU).locator(card)).toBeVisible({
      timeout: 10_000,
    });
    await setStubWeekActivities(page, [planOn(DAY.FRI)]);
    await resyncWeek(page, WEEK_1, LATER);
    await expect(dayColumn(page, DAY.FRI).locator(card)).toBeVisible({
      timeout: 10_000,
    });
    await expect(coachNotice(page)).toBeVisible();
    await expect(
      page.getByText(
        "The coach moved it to Fri, Oct 9; you had it on Thu, Oct 8."
      )
    ).toBeVisible();

    // Act
    await page.getByRole("button", { name: "Move back to Thu, Oct 8" }).click();

    // Assert
    await expect(dayColumn(page, DAY.THU).locator(card)).toBeVisible({
      timeout: 10_000,
    });
    await expect
      .poll(() => readSession(page))
      .toEqual({ workout: DAY.THU, match: DAY.THU });
  });

  test("should move the card and its match to the coach's new day", async ({
    page,
  }) => {
    // Arrange
    await setup(page, DAY.TUE);
    const card = await syncAndConvert(page, WEEK_1);
    await expect(dayColumn(page, DAY.TUE).locator(card)).toBeVisible({
      timeout: 10_000,
    });
    await setStubWeekActivities(page, [planOn(DAY.WED)]);

    // Act
    await resyncWeek(page, WEEK_1, LATER);

    // Assert
    await expect(dayColumn(page, DAY.WED).locator(card)).toBeVisible({
      timeout: 10_000,
    });
    await expect(dayColumn(page, DAY.TUE).locator(card)).toHaveCount(0);
    await expect
      .poll(() => readSession(page))
      .toEqual({ workout: DAY.WED, match: DAY.WED });
  });

  test("should carry a coach move from Sunday into the next week", async ({
    page,
  }) => {
    // Arrange
    await setup(page, DAY.SUN);
    const card = await syncAndConvert(page, WEEK_1);
    await expect(dayColumn(page, DAY.SUN).locator(card)).toBeVisible({
      timeout: 10_000,
    });
    await setStubWeekActivities(page, [planOn(DAY.NEXT_MON)]);

    // Act
    await resyncWeek(page, WEEK_2, LATER);

    // Assert
    await expect(dayColumn(page, DAY.NEXT_MON).locator(card)).toBeVisible({
      timeout: 10_000,
    });
    await expect
      .poll(() => readSession(page))
      .toEqual({ workout: DAY.NEXT_MON, match: DAY.NEXT_MON });
    await page.goto(`/calendar/${WEEK_1}`);
    await expect(dayColumn(page, DAY.SUN)).toBeVisible({ timeout: 10_000 });
    await expect(dayColumn(page, DAY.SUN).locator(card)).toHaveCount(0);
    await expect(
      dayColumn(page, DAY.SUN).getByTestId(/^(workout|coaching)-card-/)
    ).toHaveCount(0);
  });

  test("should move through the dialog in the List view with no Garmin bridge", async ({
    page,
  }) => {
    // Arrange
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await setup(page, DAY.TUE);
    await syncAndConvert(page, WEEK_1);
    // The List view is the phone default and one switch away above it.
    if ((page.viewportSize()?.width ?? 0) >= GRID_MIN_WIDTH) {
      await page.getByRole("switch", { name: "Switch to list view" }).click();
    }
    const tuesday = page.getByTestId(`calendar-list-day-${DAY.TUE}`);
    const thursday = page.getByTestId(`calendar-list-day-${DAY.THU}`);
    const card = tuesday.getByTestId(/^matched-card-/);
    await expect(card).toBeVisible({ timeout: 10_000 });

    // Act
    await moveThroughDialog(page, card, DAY.THU);

    // Assert
    await expect(thursday.getByTestId(/^matched-card-/)).toBeVisible({
      timeout: 10_000,
    });
    await expect(tuesday.getByTestId(/^matched-card-/)).toHaveCount(0);
    await expect(page.getByTestId("garmin-drift-badge")).toHaveCount(0);
    await expect(matchedCard(page)).toBeVisible();
    expect(errors).toEqual([]);
  });
});
