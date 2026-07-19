/**
 * Athlete page — Connections section.
 *
 * Post-redesign the legacy Settings → Profile → "Data Flows" tab was
 * removed; the linked-accounts + data-flows UI merged into the Athlete
 * page's "Connections" section. Brands without a discovered bridge render
 * as "Not connected" available rows.
 *
 * F4.2: per-flow "What syncs" toggles were retired from this page — routing
 * lives exclusively in the Data Hub matrix (/settings/data-hub, see
 * e2e/data-hub.spec.ts). A connected bridge card here only surfaces
 * connection state, a "Data routing" link to that matrix, and disconnect.
 *
 * Playwright Chromium runs without extension runtimes, so the Garmin
 * bridge is injected via addInitScript before page.goto (see helpers/).
 */

import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import { installGarminBridgeStub } from "./helpers/garmin-bridge-stub";
import { waitForDexieReady } from "./helpers/wait-for-dexie-ready";

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
    await waitForDexieReady(page);
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

  test("should link a connected bridge to the Data Hub matrix instead of showing per-flow toggles", async ({
    page,
  }) => {
    // Arrange — install the Garmin bridge stub BEFORE goto so discovery
    // marks Garmin as connected.
    await installGarminBridgeStub(page);
    await page.goto("/athlete");
    await waitForDexieReady(page);
    await seedProfile(page);
    await page.goto("/athlete");

    // Act — Garmin appears connected.
    await expect(page.getByText("Garmin").first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("Connected").first()).toBeVisible();

    // Assert — no more per-flow "What syncs" toggles on this page; routing
    // is a link out to the Data Hub matrix, plus disconnect stays available.
    await expect(page.getByText("What syncs")).not.toBeVisible();
    const routingLink = page.getByRole("button", { name: /data routing/i });
    await expect(routingLink).toBeVisible();
    await expect(
      page.getByRole("button", { name: /disconnect/i })
    ).toBeVisible();

    // Act — the link navigates to the Data Hub matrix.
    await routingLink.click();

    // Assert
    await expect(page).toHaveURL(/\/settings\/data-hub/);
  });
});
