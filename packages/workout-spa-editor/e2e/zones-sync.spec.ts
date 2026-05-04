/**
 * Train2Go zones-sync — end-to-end spec covering the three user-visible
 * flows from `openspec/changes/archive/2026-05-03-train2go-zones-sync/`:
 *
 *   (a) toggle-off-link        → manual sync MUST NOT issue `read-details`
 *   (b) toggle-on, empty       → silent fills, no conflict dialog
 *   (c) toggle-on, manual FTP  → conflict dialog opens with the diff
 *
 * Closes #478. Bridge stub at `helpers/train2go-bridge-stub.ts` paves over
 * the missing Chrome extension (Playwright Chromium runs unloaded), so the
 * SPA's `bridgeDiscovery` handshake completes against a deterministic
 * in-page fake.
 */
import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import { clearDexie, getWeekDates, getWeekId } from "./helpers/seed-dexie";
import {
  FIXTURE_ZONES_PAYLOAD,
  getBridgeCallActions,
  installTrain2GoBridgeStub,
} from "./helpers/train2go-bridge-stub";

const PROFILE_ID = "zones-sync-e2e-profile";
const NOW_ISO = "2026-04-28T10:00:00.000Z";

type SyncZonesFlag = boolean;
type CyclingFtp = number | undefined;

const seedProfile = async (
  page: Page,
  syncZones: SyncZonesFlag,
  ftp: CyclingFtp
): Promise<void> => {
  await page.evaluate(
    async ({ profileId, ts, syncZonesFlag, cyclingFtp }) => {
      type Db = {
        table: (n: string) => {
          put: (r: unknown) => Promise<unknown>;
          clear: () => Promise<unknown>;
        };
      };
      const db = (window as unknown as Record<string, unknown>)
        .__KAIORD_DB__ as Db;
      await db.table("profiles").clear();
      await db.table("meta").put({ key: "activeProfileId", value: profileId });
      await db.table("profiles").put({
        id: profileId,
        name: "E2E Test User",
        sportZones:
          cyclingFtp !== undefined
            ? {
                cycling: {
                  thresholds: { ftp: cyclingFtp },
                  heartRateZones: { method: "manual", zones: [] },
                },
              }
            : {},
        linkedAccounts: [
          {
            source: "train2go",
            externalUserId: "99999",
            externalUserName: "Test User",
            linkedAt: ts,
            syncZones: syncZonesFlag,
          },
        ],
        createdAt: ts,
        updatedAt: ts,
      });

      // Seed an out-of-week dummy workout so `hasAnyWorkouts` is true
      // and the FirstVisitState onboarding panel does NOT render — the
      // CalendarHeader (which owns the Sync button) only mounts when the
      // calendar has at least one workout somewhere in the database.
      type DbWithBulk = Db & {
        table: (n: string) => {
          put: (r: unknown) => Promise<unknown>;
          clear: () => Promise<unknown>;
          bulkPut?: (r: unknown[]) => Promise<unknown>;
        };
      };
      const dbb = (window as unknown as Record<string, unknown>)
        .__KAIORD_DB__ as DbWithBulk;
      await dbb.table("workouts").put({
        id: "zones-sync-dummy-workout",
        date: "2020-01-01",
        state: "raw",
        sport: "cycling",
        source: "manual",
        sourceId: "dummy",
        planId: null,
        raw: { description: "x", duration: { value: 600, unit: "s" } },
        krd: null,
        lastProcessingError: null,
        feedback: null,
        aiMeta: null,
        garminPushId: null,
        tags: [],
        previousState: null,
        createdAt: ts,
        modifiedAt: null,
        updatedAt: ts,
      });
    },
    {
      profileId: PROFILE_ID,
      ts: NOW_ISO,
      syncZonesFlag: syncZones,
      cyclingFtp: ftp,
    }
  );
};

const navigateToWeek = async (page: Page): Promise<void> => {
  const weekId = getWeekId(getWeekDates(0)[2]);
  await page.goto(`/calendar/${weekId}`);
};

const waitForSyncButton = async (page: Page): Promise<void> => {
  const syncBtn = page.getByRole("button", { name: /^sync train2go$/i });
  await syncBtn.waitFor({ state: "visible", timeout: 15_000 });
};

test.describe("Train2Go zones-sync — auto-sync flows", () => {
  test.beforeEach(async ({ page }) => {
    await installTrain2GoBridgeStub(page);
    await page.goto("/calendar");
    await page.waitForFunction(
      () =>
        Boolean((window as unknown as Record<string, unknown>).__KAIORD_DB__),
      { timeout: 10_000 }
    );
    await clearDexie(page);
  });

  test("(a) toggle-off — auto-sync does NOT issue read-details", async ({
    page,
  }) => {
    // Arrange: linked account with syncZones flag OFF.
    await seedProfile(page, false, undefined);
    await navigateToWeek(page);
    await waitForSyncButton(page);

    // Wait for read-week to settle (the auto-sync hook fires it on
    // calendar mount). With syncZones=false the fan-out check returns
    // false BEFORE read-details would queue.
    await page.waitForFunction(
      () => {
        const calls =
          ((window as unknown as Record<string, unknown>).__T2G_STUB_CALLS__ as
            | { action: string }[]
            | undefined) ?? [];
        return calls.some((c) => c.action === "read-week");
      },
      { timeout: 10_000 }
    );

    // One extra tick to let any racing fan-out queue if it were going to.
    await page.waitForTimeout(200);

    // Assert: read-details was NEVER called.
    const actions = await getBridgeCallActions(page);
    expect(actions).toContain("read-week");
    expect(actions).not.toContain("read-details");
  });

  test("(b) toggle-on with empty profile — silent fills, no dialog", async ({
    page,
  }) => {
    // Arrange: linked account with syncZones=true, profile has NO
    // pre-existing thresholds.
    await seedProfile(page, true, undefined);
    await navigateToWeek(page);
    await waitForSyncButton(page);

    // The auto-sync hook fires on calendar mount → runs syncZones after
    // read-week → reads every Kaiord field empty → writes silently.
    // Wait for read-details to land (the marker for fan-out completion).
    await page.waitForFunction(
      () => {
        const calls =
          ((window as unknown as Record<string, unknown>).__T2G_STUB_CALLS__ as
            | { action: string }[]
            | undefined) ?? [];
        return calls.some((c) => c.action === "read-details");
      },
      { timeout: 10_000 }
    );

    // Wait for the orchestrator's profile.put to settle. Polling Dexie
    // is more deterministic than a fixed sleep because the put is
    // sequenced after the readZones promise.
    await page.waitForFunction(
      ({ profileId }) => {
        type Db = {
          table: (n: string) => {
            get: (id: string) => Promise<
              | {
                  sportZones?: { cycling?: { thresholds?: { ftp?: number } } };
                }
              | undefined
            >;
          };
        };
        const db = (window as unknown as Record<string, unknown>)
          .__KAIORD_DB__ as Db;
        return db
          .table("profiles")
          .get(profileId)
          .then((p) => p?.sportZones?.cycling?.thresholds?.ftp === 268);
      },
      { profileId: PROFILE_ID },
      { timeout: 10_000 }
    );

    // Assert: dialog NOT visible (no conflicts → orchestrator stays idle).
    await expect(page.getByTestId("zones-conflict-dialog")).not.toBeVisible();

    // Assert: the persisted profile got every fixture-derived value.
    const profile = await page.evaluate(async (id) => {
      type Db = {
        table: (n: string) => { get: (k: string) => Promise<unknown> };
      };
      const db = (window as unknown as Record<string, unknown>)
        .__KAIORD_DB__ as Db;
      return (await db.table("profiles").get(id)) as {
        bodyWeight?: number;
        maxHeartRate?: number;
        sportZones: {
          cycling?: { thresholds: { ftp?: number; lthr?: number } };
          running?: {
            thresholds: { lthr?: number; thresholdPace?: number };
          };
          swimming?: { thresholds: { thresholdPace?: number } };
        };
      };
    }, PROFILE_ID);

    expect(profile.bodyWeight).toBe(FIXTURE_ZONES_PAYLOAD.physiological.weight);
    expect(profile.maxHeartRate).toBe(
      FIXTURE_ZONES_PAYLOAD.physiological.bpmMax
    );
    expect(profile.sportZones.cycling?.thresholds.ftp).toBe(268);
    expect(profile.sportZones.cycling?.thresholds.lthr).toBe(174);
    expect(profile.sportZones.running?.thresholds.lthr).toBe(168);
    // Running pace 4:10 = 250 sec, swim CSS 1:32 = 92 sec.
    expect(profile.sportZones.running?.thresholds.thresholdPace).toBe(250);
    expect(profile.sportZones.swimming?.thresholds.thresholdPace).toBe(92);
  });

  test("(c) toggle-on with manual FTP — conflict dialog opens", async ({
    page,
  }) => {
    // Arrange: linked account with syncZones=true, profile has a manual
    // FTP=200 that disagrees with the fixture's 268.
    await seedProfile(page, true, 200);
    await navigateToWeek(page);
    await waitForSyncButton(page);

    // The auto-sync hook fires on calendar mount → runs syncZones →
    // detects FTP conflict (200 vs 268) → orchestrator stashes pending
    // → provider renders ZonesConflictDialog.
    // Assert: ZonesConflictDialog opens with the FTP row.
    const dialog = page.getByTestId("zones-conflict-dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByTestId("zones-conflict-row-cycling.thresholds.ftp")
    ).toBeVisible();

    // The static label map keys "cycling.thresholds.ftp" → "FTP".
    await expect(dialog).toContainText("FTP");
    // Both old and new values render as React children.
    await expect(dialog).toContainText("200");
    await expect(dialog).toContainText("268");

    // Assert: profile FTP is STILL 200 (conflict, not silently overwritten).
    const ftpBeforeDecision = await page.evaluate(async (id) => {
      type Db = {
        table: (n: string) => { get: (k: string) => Promise<unknown> };
      };
      const db = (window as unknown as Record<string, unknown>)
        .__KAIORD_DB__ as Db;
      const p = (await db.table("profiles").get(id)) as {
        sportZones: { cycling?: { thresholds: { ftp?: number } } };
      };
      return p.sportZones.cycling?.thresholds.ftp;
    }, PROFILE_ID);
    expect(ftpBeforeDecision).toBe(200);

    // Act: cancel the dialog → leaves manual value intact.
    await page.getByRole("button", { name: /^cancel$/i }).click();
    await expect(dialog).not.toBeVisible();

    const ftpAfterCancel = await page.evaluate(async (id) => {
      type Db = {
        table: (n: string) => { get: (k: string) => Promise<unknown> };
      };
      const db = (window as unknown as Record<string, unknown>)
        .__KAIORD_DB__ as Db;
      const p = (await db.table("profiles").get(id)) as {
        sportZones: { cycling?: { thresholds: { ftp?: number } } };
      };
      return p.sportZones.cycling?.thresholds.ftp;
    }, PROFILE_ID);
    expect(ftpAfterCancel).toBe(200);
  });

  test("(d) FTP scalar + cycling.powerZones bands → coupled group row (D-MA6)", async ({
    page,
  }) => {
    // Arrange — profile with manual FTP=200 AND user-customized cycling
    // power bands. T2G payload provides FTP=268 + power Z1-Z5 bands.
    // Per D-MA6 the dialog SHALL render a single "Cycling threshold +
    // zones" group, NOT separate FTP scalar row + power bands group.
    await page.evaluate(
      async ({ profileId, ts }) => {
        type Db = {
          table: (n: string) => {
            put: (r: unknown) => Promise<unknown>;
            clear: () => Promise<unknown>;
            bulkPut?: (r: unknown[]) => Promise<unknown>;
          };
        };
        const db = (window as unknown as Record<string, unknown>)
          .__KAIORD_DB__ as Db;
        await db.table("profiles").clear();
        await db
          .table("meta")
          .put({ key: "activeProfileId", value: profileId });
        await db.table("profiles").put({
          id: profileId,
          name: "FTP+Power E2E",
          sportZones: {
            cycling: {
              thresholds: { ftp: 200 },
              heartRateZones: { method: "custom", zones: [] },
              // Power bands are method = "user" with values that differ
              // from T2G's bands (so the classifier returns
              // user-customized → emits per-band conflicts).
              powerZones: {
                method: "user",
                zones: [
                  {
                    zone: 1,
                    name: "Active Recovery",
                    minPercent: 0,
                    maxPercent: 60,
                  },
                  {
                    zone: 2,
                    name: "Endurance",
                    minPercent: 61,
                    maxPercent: 80,
                  },
                  { zone: 3, name: "Tempo", minPercent: 81, maxPercent: 95 },
                  {
                    zone: 4,
                    name: "Lactate Threshold",
                    minPercent: 96,
                    maxPercent: 110,
                  },
                  {
                    zone: 5,
                    name: "VO2 Max",
                    minPercent: 111,
                    maxPercent: 130,
                  },
                ],
              },
            },
          },
          linkedAccounts: [
            {
              source: "train2go",
              externalUserId: "99999",
              externalUserName: "Test User",
              linkedAt: ts,
              syncZones: true,
            },
          ],
          createdAt: ts,
          updatedAt: ts,
        });
        const dbWithBulk = db as Db & {
          table: (n: string) => {
            put: (r: unknown) => Promise<unknown>;
            clear: () => Promise<unknown>;
            bulkPut?: (r: unknown[]) => Promise<unknown>;
          };
        };
        const wo = dbWithBulk.table("workouts");
        if (wo.bulkPut) await wo.bulkPut([]);
      },
      { profileId: PROFILE_ID, ts: NOW_ISO }
    );

    await navigateToWeek(page);
    await waitForSyncButton(page);

    // The auto-sync hook fires on calendar mount. With FTP=200 and
    // power bands user-customized, the reconcile emits FTP scalar
    // conflict + 10 cycling power band conflicts → dialog couples them
    // into a single group.
    const dialog = page.getByTestId("zones-conflict-dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Assert: the coupled group renders (NOT a standalone FTP row).
    await expect(
      page.getByTestId("zones-conflict-group-cycling.threshold-and-zones")
    ).toBeVisible();
    await expect(dialog).toContainText("Cycling threshold + zones");

    // Cancel out — the actual decision flow is covered by unit tests.
    await page.getByRole("button", { name: /^cancel$/i }).click();
    await expect(dialog).not.toBeVisible();
  });
});
