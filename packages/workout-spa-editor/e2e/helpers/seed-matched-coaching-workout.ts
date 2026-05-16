import type { Page } from "@playwright/test";

import type { MatchedCoachingSeed } from "./build-matched-coaching-records";
import { buildMatchedCoachingRecords } from "./build-matched-coaching-records";

export type { MatchedCoachingSeed };

type Db = {
  table: (n: string) => { put: (r: unknown) => Promise<unknown> };
};

export const seedMatchedCoachingWorkout = async (
  page: Page,
  seed: MatchedCoachingSeed
): Promise<void> => {
  const records = buildMatchedCoachingRecords(seed);
  await page.evaluate(async (r) => {
    const db = (window as unknown as { __KAIORD_DB__: Db }).__KAIORD_DB__;
    if (!db) throw new Error("__KAIORD_DB__ not available");
    await db.table("profiles").put(r.profile);
    await db.table("meta").put(r.meta);
    await db.table("workouts").put(r.dummy);
    await db.table("coachingActivities").put(r.activity);
    await db.table("workouts").put(r.workout);
    await db.table("sessionMatches").put(r.match);
  }, records);
};
