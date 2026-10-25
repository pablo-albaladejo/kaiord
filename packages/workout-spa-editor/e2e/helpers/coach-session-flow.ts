/**
 * Shared steps of the coach-session reschedule specs: a fixed week on a
 * frozen clock, a linked profile whose planned sessions sync from the
 * Train2Go stub, and the reads and actions the flows assert on.
 */
import type { Page } from "@playwright/test";

import { getWeekId } from "./seed-dexie";

/** Week 1 runs Mon 2026-10-05 → Sun 2026-10-11; week 2 starts on the 12th. */
export const DAY = {
  MON: "2026-10-05",
  TUE: "2026-10-06",
  WED: "2026-10-07",
  THU: "2026-10-08",
  FRI: "2026-10-09",
  SUN: "2026-10-11",
  NEXT_MON: "2026-10-12",
} as const;
export const WEEK_1 = getWeekId(DAY.WED);
export const WEEK_2 = getWeekId(DAY.NEXT_MON);
export const NOW = `${DAY.TUE}T08:00:00Z`;

export const PLAN_ID = 4201;
export const PLAN_CARD = `train2go:${PLAN_ID}`;

/** The coach's session as `read-week` returns it, on `date`. */
export const planOn = (date: string) => ({
  id: PLAN_ID,
  date,
  sport: "cycling",
  title: "Threshold blocks",
  duration: "60 min",
  workload: 3,
  status: 0,
  description: "2 x 20 min at threshold",
});

export type Db = {
  table: (n: string) => {
    put: (r: unknown) => Promise<unknown>;
    get: (k: string) => Promise<{ date?: string } | undefined>;
    toArray: () => Promise<{ workoutId?: string; date?: string }[]>;
  };
};

/** A linked profile whose planned sessions sync, and nothing else. */
export const seedCoachProfile = (page: Page, profileId: string) =>
  page.evaluate(
    async ({ id, ts }) => {
      const db = (window as unknown as { __KAIORD_DB__: Db }).__KAIORD_DB__;
      await db.table("profiles").put({
        id,
        name: "Coach reschedule",
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
      await db.table("meta").put({ key: "activeProfileId", value: id });
      await db.table("integrationPolicies").put({
        id: `${id}-planned-session-route`,
        profileId: id,
        dataType: "planned-session",
        bridgeId: "train2go-bridge",
        direction: "import",
        mode: "auto",
        enabled: true,
        updatedAt: ts,
      });
    },
    { id: profileId, ts: NOW }
  );

export const dayColumn = (page: Page, day: string) =>
  page.locator(`[data-day="${day}"]`);

export const matchedCard = (page: Page) =>
  page.getByTestId(`matched-card-${PLAN_CARD}`);
