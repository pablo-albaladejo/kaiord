/**
 * Seed a Train2Go-linked profile, make it active, and give it one unstructured
 * coaching plan per date. Waits for the Dexie handle itself, so it can be
 * called straight after `page.goto()`.
 */
import type { Page } from "@playwright/test";

import { waitForDexieReady } from "./wait-for-dexie-ready";

export type CoachingPlansSeed = {
  profileId: string;
  dates: readonly string[];
};

type Db = {
  table: (n: string) => { put: (r: unknown) => Promise<unknown> };
};

export const seedLinkedProfileWithPlans = async (
  page: Page,
  seed: CoachingPlansSeed
): Promise<void> => {
  await waitForDexieReady(page);
  await page.evaluate(async ({ profileId, dates }) => {
    const db = (window as unknown as { __KAIORD_DB__: Db }).__KAIORD_DB__;
    const ts = new Date().toISOString();
    await db.table("profiles").put({
      id: profileId,
      name: "Plans",
      sportZones: {},
      linkedAccounts: [{ source: "train2go", externalId: "t2g-1" }],
      createdAt: ts,
      updatedAt: ts,
    });
    await db.table("meta").put({ key: "activeProfileId", value: profileId });
    for (const [index, date] of dates.entries()) {
      await db.table("coachingActivities").put({
        id: `${profileId}:train2go:plan-${index}`,
        profileId,
        source: "train2go",
        sourceId: `plan-${index}`,
        date,
        sport: "running",
        title: "Tempo intervals",
        status: "pending",
        description: "4 x 8 min at threshold",
        fetchedAt: ts,
      });
    }
  }, seed);
};
