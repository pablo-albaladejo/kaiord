/**
 * Calendar Empty States E2E Tests
 *
 * First visit, empty week, and entry-path actions.
 */

import { expect, test } from "./fixtures/base";
import {
  clearDexie,
  getWeekDates,
  getWeekId,
  makeWorkout,
  seedWorkouts,
} from "./helpers/seed-dexie";

const TWO_WEEKS_AGO = -2;
const PLAN_DAY_INDEX = 2;

// Post-redesign the week calendar lives at /calendar/:weekId (bare
// /calendar is the Today page). Empty-state assertions target the
// current week's calendar URL.
const CURRENT_WEEK_ID = getWeekId(getWeekDates(0)[0]);

test.describe("Calendar Empty States", () => {
  test.beforeEach(async ({ page }) => {
    // Boot on the week calendar so the Dexie singleton is exposed and
    // the week grid renders.
    await page.goto(`/calendar/${CURRENT_WEEK_ID}`);
    await clearDexie(page);
  });

  test("should state what has to be true when the profile has no workouts", async ({
    page,
  }) => {
    // Arrange
    // A true first run used to render nothing at all: every banner was gated
    // on data existing. The guide is what replaced that silence; the week
    // grid still renders underneath so the days remain scannable.

    // Act

    await page.reload();

    // Assert

    await expect(page.getByTestId("first-run-guide")).toBeVisible();
    await expect(
      page.getByText("Nothing here yet — and nothing will appear on its own")
    ).toBeVisible();
    await expect(page.getByTestId("first-visit-state")).not.toBeAttached();
    await expect(page.getByTestId("calendar-week-grid")).toBeVisible();
  });

  test("should not repeat the dependencies the guide already names", async ({
    page,
  }) => {
    // Arrange

    // Act

    await page.reload();

    // Assert

    await expect(page.getByTestId("first-run-guide")).toBeVisible();
    await expect(page.getByTestId("empty-week-state")).not.toBeAttached();
    await expect(page.getByTestId("no-bridges-state")).not.toBeAttached();
  });

  test("Workouts in other week but not this shows EmptyWeekState", async ({
    page,
  }) => {
    // Seed a workout in a different week (2 weeks ago)
    const otherWeekDates = getWeekDates(TWO_WEEKS_AGO);
    await seedWorkouts(page, [
      makeWorkout({ date: otherWeekDates[0], state: "structured" }),
    ]);
    await page.reload();

    // Current week should show EmptyWeekState (not FirstVisitState)
    await expect(page.getByTestId("empty-week-state")).toBeVisible();
    await expect(page.getByText(/Nothing this week/)).toBeVisible();
    await expect(page.getByTestId("first-run-guide")).not.toBeAttached();
  });

  test('EmptyWeekState "Go to latest" navigates to correct week', async ({
    page,
  }) => {
    const otherWeekDates = getWeekDates(TWO_WEEKS_AGO);
    const expectedWeekId = getWeekId(otherWeekDates[0]);

    await seedWorkouts(page, [
      makeWorkout({ date: otherWeekDates[0], state: "structured" }),
    ]);
    await page.reload();

    const banner = page.getByTestId("empty-week-state");
    await expect(banner).toBeVisible();
    // Scoped to the banner: the header's nav buttons are also named "Go to …".
    await banner.getByRole("button", { name: /^Go to / }).click();
    await page.waitForURL(new RegExp(`/calendar/${expectedWeekId}`));
  });

  test('EmptyWeekState "Add workout" navigates to /workout/new', async ({
    page,
  }) => {
    const otherWeekDates = getWeekDates(TWO_WEEKS_AGO);
    await seedWorkouts(page, [
      makeWorkout({ date: otherWeekDates[0], state: "structured" }),
    ]);
    await page.reload();

    const banner = page.getByTestId("empty-week-state");
    await expect(banner).toBeVisible();
    await banner.getByRole("button", { name: /Add workout/i }).click();
    await page.waitForURL(/\/workout\/new/);
  });
  test("should hand a week of coach plans to the missing-key banner, not the guide", async ({
    page,
  }) => {
    // Arrange
    // A synced coaching plan is not a workout until it is structured, so a
    // new user whose first sync filled the week had zero workouts and still
    // saw "Nothing here yet" above their coach's sessions.
    const day = getWeekDates(0)[PLAN_DAY_INDEX];
    await page.evaluate(
      async ({ day }) => {
        type Db = {
          table: (n: string) => { put: (r: unknown) => Promise<unknown> };
        };
        const db = (window as unknown as Record<string, unknown>)
          .__KAIORD_DB__ as Db;
        const ts = new Date().toISOString();
        await db.table("profiles").put({
          id: "plans-profile",
          name: "Plans",
          sportZones: {},
          linkedAccounts: [{ source: "train2go", externalId: "t2g-1" }],
          createdAt: ts,
          updatedAt: ts,
        });
        await db
          .table("meta")
          .put({ key: "activeProfileId", value: "plans-profile" });
        await db.table("coachingActivities").put({
          id: "plans-profile:train2go:plan-1",
          profileId: "plans-profile",
          source: "train2go",
          sourceId: "plan-1",
          date: day,
          sport: "running",
          title: "Tempo intervals",
          status: "pending",
          description: "4 x 8 min at threshold",
          fetchedAt: ts,
        });
      },
      { day }
    );

    // Act
    await page.reload();

    // Assert
    await expect(page.getByTestId("no-ai-provider-state")).toBeVisible();
    await expect(page.getByTestId("first-run-guide")).not.toBeAttached();
    await expect(page.getByTestId("empty-week-state")).not.toBeAttached();
  });
});
