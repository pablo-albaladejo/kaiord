/**
 * E2E spec for the original Rules-of-Hooks repro (issue #450, deferred from
 * the `fix-coaching-dialog-rules-of-hooks` change).
 *
 * Pre-fix bug: clicking a Train2Go-loaded coaching activity card crashed
 * with "rendered more hooks than during the previous render" and surfaced
 * the RouteErrorBoundary fallback ("Something went wrong" + role="alert").
 *
 * This spec seeds the calendar with a Train2Go-sourced coaching activity
 * whose `description` is pre-materialised (so `expandActivity` is a no-op
 * and the test does not need a live Train2Go bridge fixture), navigates
 * to the week, clicks the card, and asserts:
 *
 *   1. CoachingActivityDialog opens (data-testid="coaching-activity-dialog").
 *   2. The materialised description renders (NOT the loading placeholder).
 *   3. RouteErrorBoundary's RouteErrorFallback ("Something went wrong"
 *      role="alert") is NOT rendered anywhere on the page.
 */

import { expect, test } from "@playwright/test";

import { clearDexie, getWeekDates, getWeekId } from "./helpers/seed-dexie";
import { disableOnboardingTutorial } from "./test-setup";

const PROFILE_ID = "t2g-click-profile";
const ACTIVITY_TITLE = "Tempo intervals";
const ACTIVITY_DESCRIPTION =
  "20 min warm-up, 4 × 8 min @ tempo with 3 min recovery, 15 min cool-down";

test.describe("Coaching activity dialog — Train2Go click path", () => {
  test.beforeEach(async ({ page }) => {
    await disableOnboardingTutorial(page);
  });

  test("clicking a T2G activity opens dialog with description; no error boundary", async ({
    page,
  }) => {
    // 1. Boot the SPA so Dexie is initialised.
    await page.goto("/calendar");
    await page.waitForFunction(
      () =>
        Boolean((window as unknown as Record<string, unknown>).__KAIORD_DB__),
      { timeout: 10_000 }
    );
    await clearDexie(page);

    // 2. Pick a deterministic day inside the visible week.
    const weekDates = getWeekDates(0);
    const visibleDay = weekDates[2]; // Wednesday — avoids the today-pill edge.
    const weekId = getWeekId(visibleDay);
    const now = new Date(visibleDay + "T08:00:00Z").toISOString();

    // 3. Seed the active profile and a Train2Go coaching activity whose
    // description is already materialised (so the dialog does NOT trigger
    // expandActivity → bridge call).
    const SOURCE = "train2go";
    const SOURCE_ID = "t2g-act-1";
    // Persisted CoachingActivityRecord.id (Dexie row primary key) includes
    // the profile prefix; the view-model `CoachingActivity.id` (rendered
    // into the data-testid) drops the prefix and is `${source}:${sourceId}`.
    const RECORD_ID = `${PROFILE_ID}:${SOURCE}:${SOURCE_ID}`;
    const VIEW_MODEL_ID = `${SOURCE}:${SOURCE_ID}`;
    await page.evaluate(
      async ({
        profileId,
        activityId,
        source,
        sourceId,
        day,
        ts,
        title,
        description,
      }) => {
        type Db = {
          table: (n: string) => {
            put: (r: unknown) => Promise<unknown>;
            bulkPut: (r: unknown[]) => Promise<unknown>;
          };
        };
        const db = (window as unknown as Record<string, unknown>)
          .__KAIORD_DB__ as Db;

        await db.table("profiles").put({
          id: profileId,
          name: "T2G Test",
          sportZones: {},
          linkedAccounts: [{ source: "train2go", externalId: "t2g-acct-1" }],
          createdAt: ts,
          updatedAt: ts,
        });
        await db
          .table("meta")
          .put({ key: "activeProfileId", value: profileId });

        await db.table("coachingActivities").put({
          id: activityId,
          profileId,
          source,
          sourceId,
          date: day,
          sport: "running",
          title,
          status: "pending",
          description,
          duration: "60 min",
          fetchedAt: ts,
        });

        // Seed an out-of-week dummy workout so `hasAnyWorkouts` is true
        // and the FirstVisitState onboarding panel does not render. The
        // panel intercepts pointer events at narrow viewports and would
        // block the card click being tested here.
        await db.table("workouts").put({
          id: "t2g-click-dummy-workout",
          date: "2020-01-01",
          state: "raw",
          sport: "cycling",
          source: "manual",
          sourceId: "dummy",
          planId: null,
          raw: { description: "x", duration: { value: 600, unit: "s" } },
          krd: null,
          lastProcessingError: null,
          feedback: null,
          aiMeta: null,
          garminPushId: null,
          tags: [],
          previousState: null,
          createdAt: ts,
          modifiedAt: null,
          updatedAt: ts,
        });
      },
      {
        profileId: PROFILE_ID,
        activityId: RECORD_ID,
        source: SOURCE,
        sourceId: SOURCE_ID,
        day: visibleDay,
        ts: now,
        title: ACTIVITY_TITLE,
        description: ACTIVITY_DESCRIPTION,
      }
    );

    // 4. Navigate to the seeded week and locate the card.
    await page.goto(`/calendar/${weekId}`);
    const card = page.getByTestId(`coaching-card-${VIEW_MODEL_ID}`);
    await card.waitFor({ timeout: 10_000 });
    await card.scrollIntoViewIfNeeded();
    await expect(card).toBeVisible();

    // 5. Click the card — the regression: pre-fix this triggered
    // "rendered more hooks than during the previous render" and the
    // RouteErrorBoundary fallback.
    await card.click();

    // 6. Dialog opens, description renders, no loading placeholder, no
    // error fallback.
    const dialog = page.getByTestId("coaching-activity-dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog).toContainText(ACTIVITY_TITLE);
    await expect(dialog).toContainText(ACTIVITY_DESCRIPTION);
    await expect(
      page.getByTestId("coaching-dialog-description-loading")
    ).not.toBeVisible();
    await expect(
      page.getByRole("alert", { name: /something went wrong/i })
    ).not.toBeVisible();
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
  });
});
