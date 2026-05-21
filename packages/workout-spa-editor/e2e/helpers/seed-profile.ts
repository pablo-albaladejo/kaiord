/**
 * Seed the e2e default profile and write its id to
 * `meta.activeProfileId`. Used by `clearDexie` so every test that
 * resets Dexie starts with a valid active profile (post-Dexie v13
 * workouts require profileId).
 */

import type { Page } from "@playwright/test";

import { E2E_DEFAULT_PROFILE_ID } from "./e2e-defaults";

type DexieDb = {
  table: (n: string) => {
    bulkPut: (r: unknown[]) => Promise<void>;
    put: (r: unknown) => Promise<void>;
  };
};

export async function seedDefaultProfile(page: Page): Promise<string> {
  await page.evaluate(async (profileId) => {
    const db = (window as unknown as Record<string, unknown>).__KAIORD_DB__ as
      | DexieDb
      | undefined;
    if (!db) throw new Error("__KAIORD_DB__ not available");
    const now = new Date().toISOString();
    await db.table("profiles").bulkPut([
      {
        id: profileId,
        name: "E2E Default Profile",
        linkedAccounts: [],
        createdAt: now,
        updatedAt: now,
      },
    ]);
    await db.table("meta").put({ key: "activeProfileId", value: profileId });
    // Seed `calendarView: "grid"` so every e2e starts on the grid view
    // regardless of viewport. The viewport-aware default (list on <768
    // px) is intentional for real users but would make Mobile-Chrome /
    // Mobile-Safari Playwright projects flaky across grid-affordance
    // tests (the existing tests assume grid).
    await db.table("userPreferences").put({
      profileId,
      calendarView: "grid",
      updatedAt: now,
    });
  }, E2E_DEFAULT_PROFILE_ID);
  return E2E_DEFAULT_PROFILE_ID;
}
