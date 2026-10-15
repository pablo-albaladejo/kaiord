import type { Page } from "@playwright/test";

import {
  buildPerfWeekRows,
  type CardCounts,
  type PerfRowsInput,
} from "./calendar-perf-rows";

/** Seeds the active profile and the rows of `buildPerfWeekRows`. */
export const seedPerfWeeks = (page: Page, input: PerfRowsInput) =>
  page.evaluate(
    async ({ profileId, now, rows }) => {
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
        name: "Perf",
        sportZones: {},
        linkedAccounts: [],
        createdAt: now,
        updatedAt: now,
      });
      await db.table("meta").put({ key: "activeProfileId", value: profileId });
      await db.table("coachingActivities").bulkPut(rows.plans);
      await db.table("workouts").bulkPut(rows.workouts);
      await db.table("sessionMatches").bulkPut(rows.matches);
    },
    {
      profileId: input.profileId,
      now: input.now,
      rows: buildPerfWeekRows(input),
    }
  );

type ShowWeekInput = {
  weekId: string;
  day: string;
  counts: CardCounts;
  timeoutMs: number;
};

/**
 * Moves the already-booted calendar to `weekId` (an in-app route change: the
 * route lives in the fragment) and resolves with the milliseconds until `day`
 * shows exactly `counts` — the week's data read, joined and rendered. The
 * exact per-kind counts matter: before the matches resolve, a matched pair
 * renders as one solo plan plus one solo workout.
 */
export const showWeek = (page: Page, input: ShowWeekInput): Promise<number> =>
  page.evaluate(
    ({ weekId, day, counts, timeoutMs }) =>
      new Promise<number>((resolve, reject) => {
        const daySelector = `[data-testid="day-column-${day}"],[data-testid="calendar-list-day-${day}"]`;
        const has = (root: Element, prefix: string, n: number) =>
          root.querySelectorAll(`[data-testid^="${prefix}"]`).length === n;
        const rendered = () => {
          const root = document.querySelector(daySelector);
          return (
            root !== null &&
            has(root, "matched-card-", counts.matched) &&
            has(root, "coaching-card-", counts.soloPlans) &&
            has(root, "workout-card-", counts.soloActuals)
          );
        };
        const start = performance.now();
        const observer = new MutationObserver(() => {
          if (!rendered()) return;
          observer.disconnect();
          clearTimeout(timer);
          requestAnimationFrame(() => resolve(performance.now() - start));
        });
        const timer = setTimeout(() => {
          observer.disconnect();
          reject(new Error(`${weekId} never showed ${JSON.stringify(counts)}`));
        }, timeoutMs);
        observer.observe(document.body, { childList: true, subtree: true });
        window.location.hash = `#/calendar/${weekId}`;
      }),
    input
  );
