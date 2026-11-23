/**
 * Record the active athlete's Capability decisions the way Settings,
 * Capabilities does: on their `userPreferences` row. A spec about a
 * Capability's screens turns it on first, as an athlete would; every other
 * spec runs as a new athlete, with every Capability off.
 */

import type { Page } from "@playwright/test";

type DexieDb = {
  table: (n: string) => {
    get: (key: string) => Promise<Record<string, unknown> | undefined>;
    put: (r: unknown) => Promise<void>;
  };
};

const hasActiveAthlete = async () => {
  const db = (window as unknown as Record<string, unknown>).__KAIORD_DB__ as
    DexieDb | undefined;
  return Boolean((await db?.table("meta").get("activeProfileId"))?.value);
};

export async function setCapabilities(
  page: Page,
  decisions: Record<string, boolean>
): Promise<void> {
  await page.waitForFunction(hasActiveAthlete, undefined, { timeout: 10_000 });
  await page.evaluate(async (next) => {
    const db = (window as unknown as Record<string, unknown>).__KAIORD_DB__ as
      DexieDb | undefined;
    if (!db) throw new Error("__KAIORD_DB__ not available");
    const meta = await db.table("meta").get("activeProfileId");
    const profileId = meta?.value as string | undefined;
    if (!profileId) throw new Error("no active athlete to decide for");
    const row = (await db.table("userPreferences").get(profileId)) ?? {
      profileId,
      calendarView: "grid",
    };
    const capabilities = {
      ...(row.capabilities as Record<string, boolean> | undefined),
      ...next,
    };
    await db.table("userPreferences").put({
      ...row,
      capabilities,
      updatedAt: new Date().toISOString(),
    });
  }, decisions);
}

export const activateTemplates = (page: Page): Promise<void> =>
  setCapabilities(page, { templates: true });

/**
 * The Library destination wherever the chrome shows it now: the header entry,
 * or the bottom bar's tab below `md`. It appears once the athlete's decisions
 * are read, so a spec waits on it before clicking.
 */
export const libraryEntry = (page: Page, name: string | RegExp = /library/i) =>
  page
    .getByTestId("status-header-library-button")
    .or(page.getByTestId("bottom-nav").getByRole("button", { name }))
    .filter({ visible: true });
