/**
 * T-26 — Train2Go auto-import via IntegrationPolicy (AC-6).
 *
 * Verifies that a profile migrated from syncZones=true continues to
 * auto-fetch zones on SPA mount. The migration inserts an
 * IntegrationPolicy row for training-zones direction=import mode=auto;
 * this spec seeds that row directly (simulating a post-migration state)
 * and asserts that the train2go bridge's read-details action fires on
 * SPA mount.
 *
 * Bridge discovery uses the existing train2go-bridge-stub helper which
 * paves over the missing Chrome extension in Playwright Chromium.
 */

import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import {
  getBridgeCallActions,
  installTrain2GoBridgeStub,
  TRAIN2GO_BRIDGE_ID,
} from "./helpers/train2go-bridge-stub";

const PROFILE_ID = "t2g-zones-policy-e2e";

type DexieDb = {
  table: (n: string) => {
    put: (r: unknown) => Promise<void>;
    clear: () => Promise<void>;
  };
};

const seedProfileWithZonesPolicy = async (
  page: Page,
  profileId: string
): Promise<void> => {
  await page.evaluate(
    async ({ pid, bridgeId }) => {
      const db = (window as unknown as Record<string, unknown>)
        .__KAIORD_DB__ as DexieDb;
      const now = new Date().toISOString();
      await db.table("profiles").put({
        id: pid,
        name: "Zones Policy Profile",
        // A profile migrated from syncZones=true always retains its
        // Train2Go link; the auto-import resolves externalUserId from it.
        linkedAccounts: [
          {
            source: "train2go",
            externalUserId: "99999",
            externalUserName: "E2E",
            linkedAt: now,
          },
        ],
        sportZones: {},
        createdAt: now,
        updatedAt: now,
      });
      await db.table("meta").put({ key: "activeProfileId", value: pid });
      await db
        .table("userPreferences")
        .put({ profileId: pid, calendarView: "grid", updatedAt: now });

      // Simulate the outcome of the syncZones=true → IntegrationPolicy migration
      await db.table("integrationPolicies").put({
        id: "zones-policy-migrated",
        profileId: pid,
        dataType: "training-zones",
        bridgeId,
        direction: "import",
        mode: "auto",
        enabled: true,
        updatedAt: now,
      });
    },
    { pid: profileId, bridgeId: TRAIN2GO_BRIDGE_ID }
  );
};

test.describe("Train2Go zones auto-import via IntegrationPolicy (AC-6)", () => {
  test("should auto-fetch zones from train2go on SPA mount when auto-import policy exists", async ({
    page,
  }) => {
    // Arrange
    await installTrain2GoBridgeStub(page);
    await page.goto("/workout/new?source=scratch");
    await seedProfileWithZonesPolicy(page, PROFILE_ID);

    // Act — reload so the SPA mounts fresh with the seeded policy
    await page.reload();
    await page.waitForURL(/\/workout/, { timeout: 10_000 });

    const DISCOVERY_SETTLE_MS = 3_000;
    await page.waitForTimeout(DISCOVERY_SETTLE_MS);

    // Assert — read-details was called (zones fetch fired)
    const actions = await getBridgeCallActions(page);
    expect(actions).toContain("read-details");
  });

  test("should NOT fetch zones when the auto-import policy is disabled", async ({
    page,
  }) => {
    // Arrange
    await installTrain2GoBridgeStub(page);
    await page.goto("/workout/new?source=scratch");
    await page.evaluate(
      async ({ pid, bridgeId }) => {
        const db = (window as unknown as Record<string, unknown>)
          .__KAIORD_DB__ as DexieDb;
        const now = new Date().toISOString();
        await db.table("profiles").put({
          id: pid,
          name: "Zones Disabled Profile",
          linkedAccounts: [],
          sportZones: {},
          createdAt: now,
          updatedAt: now,
        });
        await db.table("meta").put({ key: "activeProfileId", value: pid });
        await db
          .table("userPreferences")
          .put({ profileId: pid, calendarView: "grid", updatedAt: now });

        // disabled policy — should NOT trigger auto-fetch
        await db.table("integrationPolicies").put({
          id: "zones-policy-disabled",
          profileId: pid,
          dataType: "training-zones",
          bridgeId,
          direction: "import",
          mode: "auto",
          enabled: false,
          updatedAt: now,
        });
      },
      { pid: "t2g-zones-disabled-e2e", bridgeId: TRAIN2GO_BRIDGE_ID }
    );

    // Act
    const SETTLE_MS = 2_000;
    await page.reload();
    await page.waitForURL(/\/workout/, { timeout: 10_000 });
    await page.waitForTimeout(SETTLE_MS);

    // Assert — no read-details fired for disabled policy
    const actions = await getBridgeCallActions(page);
    expect(actions).not.toContain("read-details");
  });
});
