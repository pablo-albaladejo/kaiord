/**
 * F5.3 — governed Garmin activities pull (kill test).
 *
 * The calendar-mount pull consults resolveImportPolicies(profileId,
 * 'activity', 'import') BEFORE touching the bridge:
 *   (a) no enabled activity←garmin route → the bridge `activities` action is
 *       never called and no activity row is written (kill test);
 *   (b) an enabled route → the pull fires and the activity is persisted.
 *
 * Bridge discovery + the stubbed `activities` feed use the garmin-bridge-stub
 * helper (chrome.runtime.sendMessage is not interceptable via page.route).
 */
import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import {
  GARMIN_BRIDGE_ID,
  getGarminBridgeCallActions,
  installGarminBridgeStub,
} from "./helpers/garmin-bridge-stub";
import { waitForDexieReady } from "./helpers/wait-for-dexie-ready";

const PROFILE_ID = "garmin-activities-policy-e2e";

type DexieDb = {
  table: (n: string) => {
    put: (r: unknown) => Promise<void>;
    toArray: () => Promise<unknown[]>;
  };
};

const stubActivity = () => ({
  activityId: 778899,
  startTimeLocal: "2026-07-05 07:30:00",
  activityType: { typeKey: "cycling" },
  duration: 3600,
  distance: 30000,
});

const waitForDb = (page: Page): Promise<unknown> => waitForDexieReady(page);

const seedProfile = async (page: Page): Promise<void> => {
  await page.evaluate(async (pid) => {
    const db = (window as unknown as Record<string, unknown>)
      .__KAIORD_DB__ as DexieDb;
    const now = new Date().toISOString();
    await db.table("profiles").put({
      id: pid,
      name: "Activities Pull Profile",
      linkedAccounts: [],
      sportZones: {},
      createdAt: now,
      updatedAt: now,
    });
    await db.table("meta").put({ key: "activeProfileId", value: pid });
    await db
      .table("userPreferences")
      .put({ profileId: pid, calendarView: "grid", updatedAt: now });
  }, PROFILE_ID);
};

const addActivityImportPolicy = async (page: Page): Promise<void> => {
  await page.evaluate(
    async ({ pid, bid }) => {
      const db = (window as unknown as Record<string, unknown>)
        .__KAIORD_DB__ as DexieDb;
      const now = new Date().toISOString();
      await db.table("integrationPolicies").put({
        id: `policy-${bid}-activity-import`,
        profileId: pid,
        dataType: "activity",
        bridgeId: bid,
        direction: "import",
        mode: "auto",
        enabled: true,
        updatedAt: now,
      });
    },
    { pid: PROFILE_ID, bid: GARMIN_BRIDGE_ID }
  );
};

const readActivities = (page: Page): Promise<unknown[]> =>
  page.evaluate(async () => {
    const db = (window as unknown as Record<string, unknown>)
      .__KAIORD_DB__ as DexieDb;
    return db.table("activities").toArray();
  });

test.describe("Garmin activities pull governance (F5.3)", () => {
  test("should pull and persist an activity when the import route is enabled", async ({
    page,
  }) => {
    // Arrange
    await installGarminBridgeStub(page, { activities: [stubActivity()] });
    await page.goto("/calendar");
    await waitForDb(page);
    await seedProfile(page);
    await addActivityImportPolicy(page);

    // Act — re-enter the calendar so the mount pull runs with the route live.
    await page.goto("/calendar");
    await expect
      .poll(() => getGarminBridgeCallActions(page), { timeout: 10_000 })
      .toContain("activities");

    // Assert — the pulled activity was persisted (garmin-bridge provenance).
    await expect
      .poll(async () => (await readActivities(page)).length, { timeout: 8_000 })
      .toBe(1);
    const rows = (await readActivities(page)) as {
      sourceBridgeId: string;
      externalId: string;
    }[];
    expect(rows[0]?.sourceBridgeId).toBe("garmin-bridge");
    expect(rows[0]?.externalId).toBe("778899");
  });

  test("should not touch the bridge or persist when no activity route is enabled", async ({
    page,
  }) => {
    // Arrange — bridge online + discovered, but NO activity import policy.
    await installGarminBridgeStub(page, { activities: [stubActivity()] });
    await page.goto("/calendar");
    await waitForDb(page);
    await seedProfile(page);

    // Act — discovery verifies the bridge (a `ping` fires); the gated pull runs.
    await page.goto("/calendar");
    await expect
      .poll(() => getGarminBridgeCallActions(page), { timeout: 10_000 })
      .toContain("ping");

    // Assert — the pull is fail-closed: no `activities` call, no rows written.
    expect(await getGarminBridgeCallActions(page)).not.toContain("activities");
    expect(await readActivities(page)).toHaveLength(0);
  });
});
