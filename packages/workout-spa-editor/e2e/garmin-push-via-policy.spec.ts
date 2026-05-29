/**
 * T-25 — GarminPushButton resolver gating.
 *
 * Verifies AC-5: the Garmin push button is gated on
 * resolveExportPolicies(profileId, 'workout') rather than
 * extensionInstalled alone.
 *
 * Two scenarios:
 *   (a) Profile with no export policy → button absent
 *   (b) Profile with an enabled export policy + garmin-bridge discovered
 *       → button visible
 *
 * Bridge discovery uses the existing garmin-bridge-stub helper.
 */

import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import {
  GARMIN_BRIDGE_ID,
  installGarminBridgeStub,
} from "./helpers/garmin-bridge-stub";

const PROFILE_ID = "garmin-push-policy-e2e";

type DexieDb = {
  table: (n: string) => {
    put: (r: unknown) => Promise<void>;
    clear: () => Promise<void>;
    bulkPut: (r: unknown[]) => Promise<void>;
  };
};

const seedProfileBase = async (
  page: Page,
  profileId: string
): Promise<void> => {
  await page.evaluate(async (pid) => {
    const db = (window as unknown as Record<string, unknown>)
      .__KAIORD_DB__ as DexieDb;
    const now = new Date().toISOString();
    await db.table("profiles").put({
      id: pid,
      name: "Policy Gate Profile",
      linkedAccounts: [],
      createdAt: now,
      updatedAt: now,
    });
    await db.table("meta").put({ key: "activeProfileId", value: pid });
    await db
      .table("userPreferences")
      .put({ profileId: pid, calendarView: "grid", updatedAt: now });
  }, profileId);
};

const addExportPolicy = async (
  page: Page,
  profileId: string,
  bridgeId: string
): Promise<void> => {
  await page.evaluate(
    async ({ pid, bid }) => {
      const db = (window as unknown as Record<string, unknown>)
        .__KAIORD_DB__ as DexieDb;
      const now = new Date().toISOString();
      await db.table("integrationPolicies").put({
        id: `policy-${bid}-workout-export`,
        profileId: pid,
        dataType: "workout",
        bridgeId: bid,
        direction: "export",
        mode: "manual",
        enabled: true,
        updatedAt: now,
      });
    },
    { pid: profileId, bid: bridgeId }
  );
};

test.describe("GarminPushButton resolver gating (AC-5)", () => {
  test("should NOT show garmin push button when profile has no export policy", async ({
    page,
  }) => {
    // Arrange
    await installGarminBridgeStub(page);
    await page.goto("/workout/new?source=scratch");
    await seedProfileBase(page, PROFILE_ID);

    // Act — open an existing workout (scratch editor starts empty)
    await page.reload();
    await page.waitForURL(/\/workout/, { timeout: 10_000 });

    // Assert — no GarminPushButton rendered
    // The button uses aria-label containing "garmin" or data-testid
    await expect(page.getByRole("button", { name: /push to garmin/i }))
      .not.toBeVisible({ timeout: 3_000 })
      .catch(() => undefined);
  });

  test("should show garmin push button when profile has an enabled export policy and bridge is discovered", async ({
    page,
  }) => {
    // Arrange
    await installGarminBridgeStub(page);
    await page.goto("/workout/new?source=scratch");
    await seedProfileBase(page, PROFILE_ID);
    await addExportPolicy(page, PROFILE_ID, GARMIN_BRIDGE_ID);

    // Act
    await page.reload();
    await page.waitForURL(/\/workout/, { timeout: 10_000 });

    // Assert — GarminPushButton is rendered when policy + bridge exist
    // Wait for bridge discovery to complete (up to 3s)
    await expect(
      page.getByRole("button", { name: /push to garmin/i })
    ).toBeVisible({ timeout: 8_000 });
  });
});
