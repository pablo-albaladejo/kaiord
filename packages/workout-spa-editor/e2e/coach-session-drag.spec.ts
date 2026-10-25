/**
 * Grid drag on a coach session (design §3.8, AC-21): a Train2Go plan synced
 * through the bridge stub and converted by hand is dragged from Tuesday to
 * Thursday, and a reload keeps it there. A session already done is not
 * draggable: the same hover that highlights a day for a movable card
 * highlights none for it, and it stays on its day.
 *
 * Drag exists only from 768px up: `usePointerDrag` is enabled by
 * `isDesktopViewport()` (`(min-width: 768px)`), so a phone has no drag in
 * either view. There a session moves through the dialog's Move to another
 * day, which coach-session-reschedule.spec.ts covers in the List view.
 */
import type { Locator, Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import { GRID_MIN_WIDTH } from "./helpers/calendar-day";
import { clearDexie, getWeekDates, getWeekId } from "./helpers/seed-dexie";
import { installTrain2GoBridgeStub } from "./helpers/train2go-bridge-stub";
import { waitForDexieReady } from "./helpers/wait-for-dexie-ready";

const PROFILE_ID = "coach-drag-profile";
const [, TUE, WED, THU, FRI] = getWeekDates(0);
const WEEK_ID = getWeekId(WED);
const NOW = new Date(`${TUE}T08:00:00Z`).toISOString();
const PLAN_ID = 4101;
const PLAN_CARD = `train2go:${PLAN_ID}`;
const DONE_ID = 4102;
const SOLO_ID = "coach-drag-solo";

type Db = {
  table: (n: string) => {
    put: (r: unknown) => Promise<unknown>;
    get: (k: string) => Promise<{ date?: string } | undefined>;
  };
};

const workoutRow = (id: string, day: string, extra: object) => ({
  id,
  profileId: PROFILE_ID,
  date: day,
  state: "raw",
  sport: "cycling",
  source: "manual",
  sourceId: id,
  planId: null,
  raw: { description: "x", duration: { value: 600, unit: "s" } },
  krd: null,
  lastProcessingError: null,
  feedback: null,
  aiMeta: null,
  garminPushId: null,
  tags: [],
  previousState: null,
  createdAt: NOW,
  modifiedAt: null,
  updatedAt: NOW,
  ...extra,
});

/** A linked profile whose planned sessions sync, and nothing else. */
const seedProfile = (page: Page) =>
  page.evaluate(
    async ({ profileId, ts, dummy }) => {
      const db = (window as unknown as { __KAIORD_DB__: Db }).__KAIORD_DB__;
      await db.table("profiles").put({
        id: profileId,
        name: "Coach drag",
        sportZones: {},
        linkedAccounts: [
          {
            source: "train2go",
            externalUserId: "99999",
            externalUserName: "Test User",
            linkedAt: ts,
          },
        ],
        createdAt: ts,
        updatedAt: ts,
      });
      await db.table("meta").put({ key: "activeProfileId", value: profileId });
      await db.table("integrationPolicies").put({
        id: "coach-drag-planned-session-route",
        profileId,
        dataType: "planned-session",
        bridgeId: "train2go-bridge",
        direction: "import",
        mode: "auto",
        enabled: true,
        updatedAt: ts,
      });
      // Out of the week, so the first-run guide does not cover the grid.
      await db.table("workouts").put(dummy);
    },
    {
      profileId: PROFILE_ID,
      ts: NOW,
      dummy: workoutRow("coach-drag-dummy", "2020-01-01", {}),
    }
  );

/**
 * The converted workout of the Wednesday plan, its match holding a
 * recording, and a solo workout that can move. The activity itself comes
 * from the sync, which runs first so the match never dangles.
 */
const seedDoneSession = (page: Page) =>
  page.evaluate(
    async ({ profileId, ts, day, id, planned, recording, solo }) => {
      const db = (window as unknown as { __KAIORD_DB__: Db }).__KAIORD_DB__;
      const activityId = `${profileId}:train2go:${id}`;
      await db.table("workouts").put(planned);
      await db.table("workouts").put(recording);
      await db.table("workouts").put(solo);
      await db.table("sessionMatches").put({
        id: `match-${id}`,
        profileId,
        coachingActivityId: activityId,
        workoutId: planned.id,
        date: day,
        createdAt: ts,
        source: "auto-coaching",
        executedWorkoutIds: [recording.id],
      });
    },
    {
      profileId: PROFILE_ID,
      ts: NOW,
      day: WED,
      id: String(DONE_ID),
      planned: workoutRow("done-planned", WED, {
        source: "train2go",
        sourceId: `${PROFILE_ID}:${DONE_ID}`,
        coachDate: WED,
      }),
      recording: workoutRow("done-recording", WED, {}),
      solo: workoutRow(SOLO_ID, WED, { sport: "running" }),
    }
  );

const dayColumn = (page: Page, day: string) =>
  page.locator(`[data-day="${day}"]`);

/** Presses the card and hovers the day, leaving the button down. */
const hoverDragOver = async (page: Page, card: Locator, day: string) => {
  const from = await card.boundingBox();
  const to = await dayColumn(page, day).boundingBox();
  if (!from || !to) throw new Error("card or day column has no box");
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, {
    steps: 10,
  });
};

/** The day the drag would drop on, highlighted only while a drag runs. */
const dropTarget = (page: Page) => page.locator('[data-drop-target="true"]');

const workoutDate = (page: Page, id: string) =>
  page.evaluate(async (workoutId) => {
    const db = (window as unknown as { __KAIORD_DB__: Db }).__KAIORD_DB__;
    return (await db.table("workouts").get(workoutId))?.date;
  }, id);

const syncWeek = async (page: Page) => {
  await page.goto(`/calendar/${WEEK_ID}`);
  const sync = page.getByRole("button", { name: /^sync train2go$/i });
  await sync.waitFor({ state: "visible", timeout: 15_000 });
  await sync.click();
};

/** Sync the stubbed plan, convert it by hand, and come back to the week. */
const syncAndConvert = async (page: Page): Promise<Locator> => {
  await syncWeek(page);
  const plan = page.getByTestId(`coaching-card-${PLAN_CARD}`);
  await plan.waitFor({ timeout: 15_000 });
  await plan.click();
  await page.getByTestId("coaching-dialog-edit-manually").click();
  await page.getByTestId("coaching-draft-save-button").click();
  await expect(page).toHaveURL(/\/workout\/[0-9a-f-]{16,}/, {
    timeout: 10_000,
  });
  await page.goto(`/calendar/${WEEK_ID}`);
  return page.getByTestId(`matched-card-${PLAN_CARD}`);
};

test.describe("Coach session drag", () => {
  test.skip(
    ({ viewport }) => (viewport?.width ?? 0) < GRID_MIN_WIDTH,
    "Drag needs a 768px viewport (isDesktopViewport); phones move through the dialog"
  );
  test.beforeEach(async ({ page }) => {
    await installTrain2GoBridgeStub(page, {
      weekActivities: [
        {
          id: PLAN_ID,
          date: TUE,
          sport: "cycling",
          title: "Threshold blocks",
          duration: "60 min",
          workload: 3,
          status: 0,
          description: "2 x 20 min at threshold",
        },
        {
          id: DONE_ID,
          date: WED,
          sport: "cycling",
          title: "Done ride",
          duration: "45 min",
          workload: 2,
          status: 0,
          description: "Easy spin",
        },
      ],
    });
    await page.goto("/calendar");
    await waitForDexieReady(page);
    await clearDexie(page);
    await seedProfile(page);
  });

  test("should keep a dragged coach session on its new day after a reload", async ({
    page,
  }) => {
    // Arrange
    const card = await syncAndConvert(page);
    await expect(dayColumn(page, TUE).locator(card)).toBeVisible({
      timeout: 10_000,
    });

    // Act
    await hoverDragOver(page, card, THU);
    await expect(dropTarget(page)).toHaveAttribute("data-day", THU);
    await page.mouse.up();
    await expect(dayColumn(page, THU).locator(card)).toBeVisible({
      timeout: 10_000,
    });
    await page.reload();

    // Assert
    await expect(dayColumn(page, THU).locator(card)).toBeVisible({
      timeout: 10_000,
    });
    await expect(dayColumn(page, TUE).locator(card)).toHaveCount(0);
  });

  test("should not move a session that is already done", async ({ page }) => {
    // Arrange
    await syncWeek(page);
    await page
      .getByTestId(`coaching-card-train2go:${DONE_ID}`)
      .waitFor({ timeout: 15_000 });
    await seedDoneSession(page);
    const card = page.getByTestId(`matched-card-train2go:${DONE_ID}`);
    await expect(dayColumn(page, WED).locator(card)).toBeVisible({
      timeout: 10_000,
    });
    // Positive control: the same hover on a movable card highlights a day.
    await hoverDragOver(page, page.getByTestId(`workout-card-${SOLO_ID}`), FRI);
    await expect(dropTarget(page)).toHaveAttribute("data-day", FRI);
    await page.mouse.up();
    await expect.poll(() => workoutDate(page, SOLO_ID)).toBe(FRI);

    // Act
    await hoverDragOver(page, card, FRI);
    const highlighted = await dropTarget(page).count();
    await page.mouse.up();

    // Assert
    expect(highlighted).toBe(0);
    await expect(dayColumn(page, WED).locator(card)).toBeVisible();
    expect(await workoutDate(page, "done-planned")).toBe(WED);
  });
});
