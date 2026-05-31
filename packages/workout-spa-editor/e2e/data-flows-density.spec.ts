/**
 * Athlete page — Connections section.
 *
 * Post-redesign the legacy Settings → Profile → "Data Flows" tab was
 * removed; the linked-accounts + data-flows UI merged into the Athlete
 * page's "Connections" section. A connected bridge (here, the Garmin
 * stub) renders an expandable row with "What syncs" flow toggles; brands
 * without a discovered bridge render as "Not connected" available rows.
 *
 * Playwright Chromium runs without extension runtimes, so the Garmin
 * bridge is injected via addInitScript before page.goto (see helpers/).
 */

import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import { installGarminBridgeStub } from "./helpers/garmin-bridge-stub";

const PROFILE_ID = "connections-profile";

type DexieDb = {
  table: (n: string) => {
    put: (r: unknown) => Promise<void>;
    clear: () => Promise<void>;
    bulkPut: (r: unknown[]) => Promise<void>;
  };
};

const seedProfile = async (page: Page): Promise<void> => {
  await page.evaluate(
    async ({ profileId }) => {
      const db = (window as unknown as Record<string, unknown>)
        .__KAIORD_DB__ as DexieDb;
      if (!db) throw new Error("__KAIORD_DB__ not available");
      const now = new Date().toISOString();
      await db.table("profiles").put({
        id: profileId,
        name: "Connections Test Profile",
        linkedAccounts: [],
        sportZones: {},
        createdAt: now,
        updatedAt: now,
      });
      await db.table("meta").put({ key: "activeProfileId", value: profileId });
      await db
        .table("userPreferences")
        .put({ profileId, calendarView: "grid", updatedAt: now });
    },
    { profileId: PROFILE_ID }
  );
};

test.describe("Athlete Connections", () => {
  test("should render the Connections section with available brands", async ({
    page,
  }) => {
    // Arrange
    await page.goto("/athlete");
    await page.waitForFunction(
      () =>
        Boolean((window as unknown as Record<string, unknown>).__KAIORD_DB__),
      { timeout: 10_000 }
    );
    await seedProfile(page);

    // Act
    await page.goto("/athlete");

    // Assert — section heading + an available (not-yet-connected) brand.
    await expect(
      page.getByRole("heading", { name: /connections/i })
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Strava")).toBeVisible();
    await expect(page.getByText("Not connected").first()).toBeVisible();
  });

  test("should expand a connected bridge to reveal What-syncs flow toggles", async ({
    page,
  }) => {
    // Arrange — install the Garmin bridge stub BEFORE goto so discovery
    // marks Garmin as connected.
    await installGarminBridgeStub(page);
    await page.goto("/athlete");
    await page.waitForFunction(
      () =>
        Boolean((window as unknown as Record<string, unknown>).__KAIORD_DB__),
      { timeout: 10_000 }
    );
    await seedProfile(page);
    await page.goto("/athlete");

    // Act — Garmin appears connected; expand its row.
    const garminRow = page.getByRole("button", { name: /garmin/i }).first();
    await expect(garminRow).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Connected").first()).toBeVisible();
    await garminRow.click();

    // Assert — the "What syncs" group with per-flow toggles is revealed.
    await expect(page.getByText("What syncs")).toBeVisible();
    await expect(
      page.getByRole("switch", { name: "Completed activities" })
    ).toBeVisible();
    await expect(
      page.getByRole("switch", { name: "Planned workouts" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /disconnect/i })
    ).toBeVisible();
  });
});
