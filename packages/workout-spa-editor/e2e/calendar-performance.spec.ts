/**
 * Calendar Performance Budget — design D16 of
 * calendar-coaching-redesign-completion / spec spa-calendar
 * "CalendarPage performance budget".
 *
 * Asserts that the redesigned CalendarPage renders its first contentful
 * paint within 200 ms on the project's reference baseline (Linux
 * ubuntu-latest CI runner with CDP CPU throttling factor 4×) when the
 * visible week contains 30 cards distributed as 10 matched / 10 solo
 * plan / 10 solo actual. The `useMatchedSessions` hook contributes no
 * more than 30 ms to that budget.
 *
 * Seed data shape:
 *   - 30 rows total, all in the same visible week:
 *     * 10 coachingActivities + 10 workouts + 10 sessionMatches → matched
 *     * 10 coachingActivities (no match) → solo plans
 *     * 10 workouts (no match) → solo actuals
 *   - One profile is also seeded so `useActiveProfileLive` resolves.
 *
 * Reproduction:
 *   pnpm --filter @kaiord/workout-spa-editor test:e2e \
 *     --grep "CalendarPage performance budget"
 *
 * Failure semantics: the spec retries up to Playwright's default twice
 * to absorb runner variance; persistent failures across all retries are
 * real regressions and block the merge.
 */

import { expect, test } from "./fixtures/base";

const FCP_BUDGET_MS = 200;
const USE_MATCHED_SESSIONS_BUDGET_MS = 30;
const CPU_THROTTLE_RATE = 4;
const PROFILE_ID = "11111111-1111-4111-8111-111111111111";
const WEEK_ID = "2026-W18";
const VISIBLE_DAY = "2026-04-29";
const NOW = "2026-04-29T10:00:00.000Z";

type SeedShape = {
  matched: number;
  soloPlans: number;
  soloActuals: number;
};

const SEED: SeedShape = {
  matched: 10,
  soloPlans: 10,
  soloActuals: 10,
};

test.describe("CalendarPage performance budget", () => {
  test.use({ storageState: undefined });

  test("FCP ≤ 200ms and useMatchedSessions ≤ 30ms with 30-card week", async ({
    page,
    browser,
  }) => {
    // Throttle CPU before the navigation so the budget reflects the
    // mid-tier-mobile reference baseline (Moto G Power 2022, ≈ 4×).
    const context = page.context();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", {
      rate: CPU_THROTTLE_RATE,
    });

    // Disable the onboarding tutorial *and* seed the test database
    // before the SPA boots — this puts everything in IndexedDB before
    // the first React render so the FCP measurement reflects steady
    // state, not the empty-week skeleton.
    await page.addInitScript(
      ({ seed, profileId, visibleDay, now }) => {
        const open = indexedDB.open("kaiord-spa");
        return new Promise<void>((resolve, reject) => {
          open.onerror = () => reject(open.error);
          open.onsuccess = () => {
            const db = open.result;
            const tx = db.transaction(
              ["profiles", "coachingActivities", "workouts", "sessionMatches"],
              "readwrite"
            );
            tx.objectStore("profiles").put({
              id: profileId,
              name: "Perf",
              sportZones: {},
              linkedAccounts: [],
              createdAt: now,
              updatedAt: now,
            });
            for (let i = 0; i < seed.matched; i += 1) {
              const aid = `perf-act-matched-${i}`;
              const wid = `perf-w-matched-${i}`;
              tx.objectStore("coachingActivities").put({
                id: aid,
                profileId,
                source: "train2go",
                sourceId: `m-${i}`,
                date: visibleDay,
                sport: "cycling",
                title: `M ${i}`,
                status: "completed",
                fetchedAt: now,
              });
              tx.objectStore("workouts").put({
                id: wid,
                date: visibleDay,
                state: "raw",
                sport: "cycling",
                source: "manual",
                sourceId: wid,
                planId: null,
                raw: { description: "x", duration: { value: 3600, unit: "s" } },
                krd: null,
                lastProcessingError: null,
                feedback: null,
                aiMeta: null,
                garminPushId: null,
                tags: [],
                previousState: null,
                createdAt: now,
                modifiedAt: null,
                updatedAt: now,
              });
              tx.objectStore("sessionMatches").put({
                id: `perf-match-${i}`,
                profileId,
                coachingActivityId: aid,
                workoutId: wid,
                date: visibleDay,
                createdAt: now,
                source: "manual",
              });
            }
            for (let i = 0; i < seed.soloPlans; i += 1) {
              tx.objectStore("coachingActivities").put({
                id: `perf-act-solo-${i}`,
                profileId,
                source: "train2go",
                sourceId: `sp-${i}`,
                date: visibleDay,
                sport: "cycling",
                title: `SP ${i}`,
                status: "pending",
                fetchedAt: now,
              });
            }
            for (let i = 0; i < seed.soloActuals; i += 1) {
              const wid = `perf-w-solo-${i}`;
              tx.objectStore("workouts").put({
                id: wid,
                date: visibleDay,
                state: "raw",
                sport: "cycling",
                source: "manual",
                sourceId: wid,
                planId: null,
                raw: { description: "x", duration: { value: 3600, unit: "s" } },
                krd: null,
                lastProcessingError: null,
                feedback: null,
                aiMeta: null,
                garminPushId: null,
                tags: [],
                previousState: null,
                createdAt: now,
                modifiedAt: null,
                updatedAt: now,
              });
            }
            tx.oncomplete = () => {
              try {
                localStorage.setItem("activeProfileId", profileId);
              } catch (e) {
                // ignore — surfaced again below if it actually matters
              }
              resolve();
            };
            tx.onerror = () => reject(tx.error);
          };
        });
      },
      {
        seed: SEED,
        profileId: PROFILE_ID,
        visibleDay: VISIBLE_DAY,
        now: NOW,
      }
    );

    await page.goto(`/calendar/${WEEK_ID}`);

    // Wait for the page to render its first card; without a settled
    // DOM the FCP entry can predate the calendar grid mounting.
    await page.getByTestId("calendar-page").waitFor({ state: "visible" });

    const fcpMs = await page.evaluate(() => {
      const entry = performance.getEntriesByName("first-contentful-paint")[0];
      return entry ? entry.startTime : Number.POSITIVE_INFINITY;
    });
    expect(
      fcpMs,
      `CalendarPage FCP ${fcpMs.toFixed(1)}ms exceeds the ${FCP_BUDGET_MS}ms budget (CPU throttle ${CPU_THROTTLE_RATE}×, 30-card week)`
    ).toBeLessThanOrEqual(FCP_BUDGET_MS);

    // Take the worst single useMatchedSessions measure entry — multiple
    // re-renders are normal under live-query re-fires; the budget is
    // per-invocation, not aggregate.
    const useMatchedMaxMs = await page.evaluate(() => {
      const entries = performance.getEntriesByName("useMatchedSessions");
      if (entries.length === 0) return Number.POSITIVE_INFINITY;
      return Math.max(...entries.map((e) => e.duration));
    });
    expect(
      useMatchedMaxMs,
      `useMatchedSessions worst measure ${useMatchedMaxMs.toFixed(1)}ms exceeds the ${USE_MATCHED_SESSIONS_BUDGET_MS}ms slice (CPU throttle ${CPU_THROTTLE_RATE}×, 10 matched rows)`
    ).toBeLessThanOrEqual(USE_MATCHED_SESSIONS_BUDGET_MS);

    await cdp.detach();
    await context.close();
    await browser.contexts().forEach(() => undefined);
  });
});
