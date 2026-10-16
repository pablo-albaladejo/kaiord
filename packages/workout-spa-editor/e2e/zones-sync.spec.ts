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

// Fixture-derived zone values from FIXTURE_ZONES_PAYLOAD (see
// helpers/train2go-bridge-stub.ts). Hoisted to named constants so the
// e2e assertions self-document which threshold the dialog and Dexie
// row are expected to expose after a successful sync.
const FIXTURE_CYCLING_FTP = 268;
const FIXTURE_CYCLING_LTHR_BPM = 174;
const FIXTURE_RUNNING_LTHR_BPM = 168;
const FIXTURE_RUNNING_THRESHOLD_PACE_S = 250;
const FIXTURE_SWIMMING_THRESHOLD_PACE_S = 92;
const MANUAL_HR_BAND_Z4_MAX_BPM = 180;
const MANUAL_HR_BAND_ZONE = 4;
const STABILITY_REREAD_TICK_MS = 50;
const ORCHESTRATOR_PUT_SETTLE_MS = 150;
// The first bridge action (read-week) only fires once bridge discovery has
// resolved. On a cold CI runner the SPA's discovery machinery can lag: the
// self-healing KAIORD_BRIDGE_DISCOVER handshake is emitted 3 s after
// `bridgeDiscovery.start()`, which itself waits on cold Vite module
// compilation under load. That chain (start → +3 s DISCOVER → verify ping →
// effect re-run → syncWeek → readWeek) can crest a tight 10 s deadline even
// though production has no such deadline and self-heals indefinitely. Give the
// discovery-gated first action a generous budget so the wait is not racing the
// runner. Well under the 60 s per-test timeout.
const AUTOSYNC_FIRST_ACTION_TIMEOUT_MS = 30_000;

type SyncZonesFlag = boolean;
type CyclingFtp = number | undefined;

const seedProfile = async (
  page: Page,
  syncZones: SyncZonesFlag,
  ftp: CyclingFtp,
  weightRouteEnabled?: boolean
): Promise<void> => {
  await page.evaluate(
    async ({ profileId, ts, syncZonesFlag, cyclingFtp, weightRoute }) => {
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

      // Zones auto-import is gated on an enabled auto-import
      // IntegrationPolicy (the syncZones flag was migrated to one). Clear
      // any prior policy, then mirror the test's syncZones intent onto a
      // policy so the auto-sync fan-out fires (or not) accordingly.
      await db.table("integrationPolicies").clear();
      // Written before the zones route below: that route is what lets the
      // mounted calendar start a sync, which must already see this one.
      if (weightRoute !== undefined) {
        await db.table("integrationPolicies").put({
          id: "zones-sync-weight-route",
          profileId,
          dataType: "weight",
          bridgeId: "train2go-bridge",
          direction: "import",
          mode: "auto",
          enabled: weightRoute,
          updatedAt: ts,
        });
      }
      // Coaching sync (read-week) is governed by an enabled planned-session
      // import route (F1.3). Seed it so the Sync button is active and
      // syncWeek proceeds; the syncZones flag only gates the zones fan-out.
      await db.table("integrationPolicies").put({
        id: "zones-sync-planned-session-route",
        profileId,
        dataType: "planned-session",
        bridgeId: "train2go-bridge",
        direction: "import",
        mode: "auto",
        enabled: true,
        updatedAt: ts,
      });
      if (syncZonesFlag) {
        await db.table("integrationPolicies").put({
          id: "zones-sync-auto-policy",
          profileId,
          dataType: "training-zones",
          bridgeId: "train2go-bridge",
          direction: "import",
          mode: "auto",
          enabled: true,
          updatedAt: ts,
        });
      }

      // Seed an out-of-week dummy workout so `hasAnyWorkouts` is true
      // and the first-run guide does NOT render. The workout must carry
      // the active `profileId`: the calendar counts workouts per profile,
      // and without it the 554px guide pushes the Sync button down under
      // the fixed chat FAB at the 1280x720 desktop viewport, where the
      // click would land on the FAB instead.
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
        profileId,
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
      weightRoute: weightRouteEnabled,
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

/**
 * Wait for a bridge action to be recorded by the stub, on the generous
 * discovery-gated budget. The timeout MUST ride in the 3rd positional slot —
 * `waitForFunction(fn, arg, options)`. Passing `{ timeout }` as the 2nd arg
 * silently swallows it as the page-function argument, leaving the wait on the
 * ~10 s default; that is what let the first (cold-Vite) action race and flake.
 */
const waitForBridgeAction = (page: Page, action: string): Promise<unknown> =>
  page.waitForFunction(
    (name) => {
      const calls =
        ((window as unknown as Record<string, unknown>).__T2G_STUB_CALLS__ as
          { action: string }[] | undefined) ?? [];
      return calls.some((c) => c.action === name);
    },
    action,
    { timeout: AUTOSYNC_FIRST_ACTION_TIMEOUT_MS }
  );

test.describe("Train2Go zones-sync — auto-sync flows", () => {
  test.beforeEach(async ({ page }) => {
    await installTrain2GoBridgeStub(page);
    await page.goto("/calendar");
    await page.waitForFunction(
      () =>
        Boolean((window as unknown as Record<string, unknown>).__KAIORD_DB__),
      undefined,
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
    await waitForBridgeAction(page, "read-week");

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
    await waitForBridgeAction(page, "read-details");

    // Wait for the orchestrator's profile.put to settle. Polling Dexie
    // is more deterministic than a fixed sleep because the put is
    // sequenced after the readZones promise.
    await page.waitForFunction(
      ({ profileId, expectedFtp }) => {
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
          .then((p) => p?.sportZones?.cycling?.thresholds?.ftp === expectedFtp);
      },
      { profileId: PROFILE_ID, expectedFtp: FIXTURE_CYCLING_FTP },
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

    // The weight is the athlete's current weight: one Train2Go weigh-in for
    // today, written with the profile, and never profile.bodyWeight.
    expect(profile.bodyWeight).toBeUndefined();
    expect(await readWeighIns(page)).toEqual([
      {
        date: await localToday(page),
        kg: FIXTURE_ZONES_PAYLOAD.physiological.weight,
        source: "train2go-bridge",
      },
    ]);
    expect(profile.maxHeartRate).toBe(
      FIXTURE_ZONES_PAYLOAD.physiological.bpmMax
    );
    expect(profile.sportZones.cycling?.thresholds.ftp).toBe(
      FIXTURE_CYCLING_FTP
    );
    expect(profile.sportZones.cycling?.thresholds.lthr).toBe(
      FIXTURE_CYCLING_LTHR_BPM
    );
    expect(profile.sportZones.running?.thresholds.lthr).toBe(
      FIXTURE_RUNNING_LTHR_BPM
    );
    // Running pace 4:10 = 250 sec, swim CSS 1:32 = 92 sec.
    expect(profile.sportZones.running?.thresholds.thresholdPace).toBe(
      FIXTURE_RUNNING_THRESHOLD_PACE_S
    );
    expect(profile.sportZones.swimming?.thresholds.thresholdPace).toBe(
      FIXTURE_SWIMMING_THRESHOLD_PACE_S
    );
  });

  test("(b2) weight route switched off — the zones sync, the weight is not recorded", async ({
    page,
  }) => {
    // Arrange: the same empty profile as (b), with the Train2Go weight route
    // switched off in the Data Hub.
    await seedProfile(page, true, undefined, false);

    // Act
    await navigateToWeek(page);
    await waitForSyncButton(page);
    await waitForBridgeAction(page, "read-details");
    // The profile and the weigh-in are written in one transaction, so once the
    // FTP is visible the weigh-in would be too.
    await page.waitForFunction(
      ({ profileId, expectedFtp }) => {
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
          .then((p) => p?.sportZones?.cycling?.thresholds?.ftp === expectedFtp);
      },
      { profileId: PROFILE_ID, expectedFtp: FIXTURE_CYCLING_FTP },
      { timeout: 10_000 }
    );

    // Assert
    await expect(page.getByTestId("zones-conflict-dialog")).not.toBeVisible();
    expect(await readWeighIns(page)).toEqual([]);
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
        await db.table("integrationPolicies").put({
          id: "zones-sync-planned-session-route",
          profileId,
          dataType: "planned-session",
          bridgeId: "train2go-bridge",
          direction: "import",
          mode: "auto",
          enabled: true,
          updatedAt: ts,
        });
        await db.table("integrationPolicies").put({
          id: "zones-sync-auto-policy",
          profileId,
          dataType: "training-zones",
          bridgeId: "train2go-bridge",
          direction: "import",
          mode: "auto",
          enabled: true,
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

  // (g)/(h)/(i) — issue #508: regression-safety flows for the
  // common user journey on a fresh profile. (g) verifies
  // template-defaults are silent-replaced by the 6-state classifier
  // (no false-positive conflict dialog on first sync — the bug that
  // motivated the zones-method-aware-reconcile change). (h) verifies
  // re-sync is idempotent. (i) verifies a manual ZoneEditor-style
  // edit flips method to "user" and surfaces ONE group row on the
  // next sync (NOT 5 individual band rows by default — D-MA5
  // grouping invariant).
  test("(g) first-sync against template-defaults profile produces zero conflicts", async ({
    page,
  }) => {
    // Arrange — profile with createNewProfile-shaped sportZones:
    // HR all-zero × 5 (method "custom"), cycling power Coggan-7
    // (method "coggan-7"). Reconcile MUST classify these as
    // default-template / method-derived and silent-replace.
    await seedTemplateDefaultsProfile(page);
    await navigateToWeek(page);
    await waitForSyncButton(page);

    await waitForCyclingFtp(page);

    // Assert: dialog NEVER opened (the entire reason this issue exists).
    await expect(page.getByTestId("zones-conflict-dialog")).not.toBeVisible();

    // Assert: bands silent-replaced and method flipped to "train2go"
    // for tables that received bands. Only HR is asserted in detail —
    // power+pace populate via the same reconcile path.
    const profile = await readProfile(page);
    expect(profile.sportZones.cycling?.heartRateZones?.method).toBe("train2go");
    expect(
      profile.sportZones.cycling?.heartRateZones?.zones?.[0]
    ).toMatchObject({ minBpm: 107, maxBpm: 133 });
    expect(profile.sportZones.running?.heartRateZones?.method).toBe("train2go");
    expect(profile.sportZones.swimming?.heartRateZones?.method).toBe(
      "train2go"
    );
    // Snapshot recorded so flow (h) can assert idempotence.
    expect(profile.linkedAccounts?.[0]?.lastSyncedZonesSnapshot).toBeDefined();
  });

  test("(h) idempotent re-sync produces zero conflicts and no zone changes", async ({
    page,
  }) => {
    // Arrange: pre-seed a profile already in `train2go-synced-clean`
    // state (zones match snapshot exactly) with a recent
    // coachingSyncState row, so the week sync skips on mount. The zones
    // import still runs once per mount (it is gated only on the
    // training-zones policy) and issues its own read-details.
    await seedTrain2GoSyncedProfile(page);
    await navigateToWeek(page);
    await waitForSyncButton(page);

    // That mount-time read-details is the barrier: once it is recorded,
    // the import has spent its one run for this mount, so every later
    // read-details comes from the click.
    await waitForBridgeAction(page, "read-details");
    const before = await readProfile(page);
    const weekCallsBefore = await countBridgeAction(page, "read-week");
    const detailsCallsBefore = await countBridgeAction(page, "read-details");

    // Act: trigger sync via the manual button.
    await page.getByRole("button", { name: /^sync train2go$/i }).click();

    // Wait for the click's own sync: only the manual sync reads the week
    // (the mount skipped it), and it then fans out to the zones sync.
    await page.waitForFunction(
      ({ weekBaseline, detailsBaseline }) => {
        const calls =
          ((window as unknown as Record<string, unknown>).__T2G_STUB_CALLS__ as
            { action: string }[] | undefined) ?? [];
        const count = (name: string) =>
          calls.filter((c) => c.action === name).length;
        return (
          count("read-week") > weekBaseline &&
          count("read-details") > detailsBaseline
        );
      },
      { weekBaseline: weekCallsBefore, detailsBaseline: detailsCallsBefore },
      { timeout: 10_000 }
    );
    // One extra tick so the orchestrator's repo.put (if any) settles.
    await page.waitForTimeout(ORCHESTRATOR_PUT_SETTLE_MS);

    // Assert: no dialog (every table classifies as
    // train2go-synced-clean → silent no-op).
    await expect(page.getByTestId("zones-conflict-dialog")).not.toBeVisible();

    // Assert: full sportZones tree is byte-identical (covers HR,
    // power, pace across all sports — not just cycling). Method +
    // ftp checks stay as explicit guards so a regression like
    // "method silently flipped to user" surfaces with a useful diff.
    const after = await readProfile(page);
    expect(after.sportZones).toEqual(before.sportZones);
    expect(after.sportZones.cycling?.heartRateZones?.method).toBe("train2go");
    expect(after.sportZones.cycling?.thresholds.ftp).toBe(
      before.sportZones.cycling?.thresholds.ftp
    );
  });

  test("(i) manual band edit → next sync surfaces ONE group row, not per-band rows", async ({
    page,
  }) => {
    // Arrange: the profile is seeded already carrying the manual edit —
    // one cycling HR band changed and the method flipped to "user", as
    // ZoneEditor's `updateSportZones` leaves it (D-MA3, unit-tested in
    // update-sport-zones.test.ts). The edit cannot be written after the
    // page mounts: the zones import runs once per mount, gated only on the
    // training-zones policy (the recent coachingSyncState gates the week
    // sync, not this), and when its read landed after a late edit it found
    // the conflict itself and opened the modal over the Sync button.
    await seedTrain2GoSyncedProfile(page, MANUAL_HR_BAND_Z4_MAX_BPM);
    await navigateToWeek(page);
    await waitForSyncButton(page);

    // That mount-time import is the first sync to see the edit, so its
    // dialog is the barrier: once it is up, no other sync is in flight.
    const dialog = page.getByTestId("zones-conflict-dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: /^cancel$/i }).click();
    await expect(dialog).not.toBeVisible();

    // Act: trigger sync via the manual button.
    await page.getByRole("button", { name: /^sync train2go$/i }).click();

    // Assert: dialog renders ONE group row for the cycling HR table
    // (D-MA5 — per-band rows live behind the [▼ Detail] disclosure,
    // not in the default rendering).
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByTestId("zones-conflict-group-cycling.heartRateZones")
    ).toBeVisible();

    // The 5 individual band rows MUST NOT be visible by default —
    // they're inside the collapsed Detail. The most reliable check
    // is that the per-band testid query returns 0 visible matches at
    // the top of the dialog tree.
    await expect(
      page.getByTestId("zones-conflict-row-cycling.heartRateZones.z4.maxBpm")
    ).not.toBeVisible();

    // Cancel — decision flow is unit-tested.
    await page.getByRole("button", { name: /^cancel$/i }).click();
    await expect(dialog).not.toBeVisible();
  });
});

const seedTemplateDefaultsProfile = async (page: Page): Promise<void> => {
  await page.evaluate(
    async ({ profileId, ts }) => {
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

      // Mirrors createNewProfile output (HR all-zero × 5, cycling
      // power Coggan-7, etc). Coggan-7 zones are computed at runtime
      // by calculatePowerZones — encoded inline here so the e2e
      // doesn't import application code.
      const emptyHr = {
        method: "custom",
        zones: [
          { zone: 1, name: "Recovery", minBpm: 0, maxBpm: 0 },
          { zone: 2, name: "Aerobic", minBpm: 0, maxBpm: 0 },
          { zone: 3, name: "Tempo", minBpm: 0, maxBpm: 0 },
          { zone: 4, name: "Threshold", minBpm: 0, maxBpm: 0 },
          { zone: 5, name: "VO2 Max", minBpm: 0, maxBpm: 0 },
        ],
      };
      await db.table("profiles").put({
        id: profileId,
        name: "Template Defaults E2E",
        sportZones: {
          cycling: {
            thresholds: {},
            heartRateZones: { ...emptyHr },
            powerZones: {
              method: "coggan-7",
              zones: [
                {
                  zone: 1,
                  name: "Active Recovery",
                  minPercent: 0,
                  maxPercent: 55,
                },
                { zone: 2, name: "Endurance", minPercent: 56, maxPercent: 75 },
                { zone: 3, name: "Tempo", minPercent: 76, maxPercent: 90 },
                {
                  zone: 4,
                  name: "Lactate Threshold",
                  minPercent: 91,
                  maxPercent: 105,
                },
                { zone: 5, name: "VO2 Max", minPercent: 106, maxPercent: 120 },
                {
                  zone: 6,
                  name: "Anaerobic Capacity",
                  minPercent: 121,
                  maxPercent: 150,
                },
                {
                  zone: 7,
                  name: "Neuromuscular Power",
                  minPercent: 151,
                  maxPercent: 200,
                },
              ],
            },
          },
          running: {
            thresholds: {},
            heartRateZones: { ...emptyHr },
            powerZones: { method: "custom", zones: [] },
            paceZones: { method: "custom", zones: [] },
          },
          swimming: {
            thresholds: {},
            heartRateZones: { ...emptyHr },
            paceZones: { method: "custom", zones: [] },
          },
          generic: {
            thresholds: {},
            heartRateZones: { ...emptyHr },
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
      await db.table("integrationPolicies").put({
        id: "zones-sync-planned-session-route",
        profileId,
        dataType: "planned-session",
        bridgeId: "train2go-bridge",
        direction: "import",
        mode: "auto",
        enabled: true,
        updatedAt: ts,
      });
      await db.table("integrationPolicies").put({
        id: "zones-sync-auto-policy",
        profileId,
        dataType: "training-zones",
        bridgeId: "train2go-bridge",
        direction: "import",
        mode: "auto",
        enabled: true,
        updatedAt: ts,
      });

      // Dummy workout, owned by the profile, so the calendar header (and
      // Sync button) mounts without the first-run guide (see
      // `seedProfile`).
      await db.table("workouts").put({
        id: "zones-sync-dummy-workout-template",
        profileId,
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
    { profileId: PROFILE_ID, ts: NOW_ISO }
  );
};

// Pre-seed for flows (h)/(i): profile already in `train2go-synced-clean`
// state PLUS a recent coachingSyncState row. The recent timestamp makes
// `isStale` return false, so the week sync skips on calendar mount. It
// does NOT stop the zones import that runs once per mount on the
// training-zones policy. `editedCyclingZ4MaxBpm` seeds flow (i)'s manual
// band edit: that cycling HR band diverges and its method is "user".
const seedTrain2GoSyncedProfile = async (
  page: Page,
  editedCyclingZ4MaxBpm?: number
): Promise<void> => {
  await page.evaluate(
    async ({ profileId, ts, editedZ4Max, editedZone }) => {
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

      // T2G-derived bands (matches FIXTURE_ZONES_PAYLOAD generic for
      // HR, cycling Specific has same z4Upper=174). Both a band table
      // and the snapshot are present and identical → classifier
      // returns `train2go-synced-clean`.
      const t2gHrBands = [
        { zone: 1, name: "Recovery", minBpm: 107, maxBpm: 133 },
        { zone: 2, name: "Aerobic", minBpm: 134, maxBpm: 147 },
        { zone: 3, name: "Tempo", minBpm: 148, maxBpm: 160 },
        { zone: 4, name: "Threshold", minBpm: 161, maxBpm: 174 },
        { zone: 5, name: "VO2 Max", minBpm: 175, maxBpm: 187 },
      ];
      const train2goHr = {
        method: "train2go",
        zones: t2gHrBands.map((z) => ({ ...z })),
      };
      const cyclingHr =
        editedZ4Max === undefined
          ? train2goHr
          : {
              method: "user",
              zones: t2gHrBands.map((z) =>
                z.zone === editedZone ? { ...z, maxBpm: editedZ4Max } : { ...z }
              ),
            };
      // Power/pace bands kept schema-aligned (length 5) per
      // `lastSyncedZonesSnapshotSchema` — the snapshot writer would
      // populate full arrays after a real sync, so the seed mirrors
      // that shape rather than empty arrays. Power %FTP percentages
      // come from FIXTURE_ZONES_PAYLOAD's cycling watts table
      // divided by FTP=268; pace bands come from the same fixture.
      const t2gCyclingPower = [
        {
          zone: 1,
          name: "Active Recovery",
          minPercent: 41,
          maxPercent: 56,
        },
        { zone: 2, name: "Endurance", minPercent: 56, maxPercent: 76 },
        { zone: 3, name: "Tempo", minPercent: 76, maxPercent: 89 },
        {
          zone: 4,
          name: "Lactate Threshold",
          minPercent: 90,
          maxPercent: 100,
        },
        { zone: 5, name: "VO2 Max", minPercent: 100, maxPercent: 144 },
      ];
      const t2gRunningPace = [
        { zone: 1, name: "Recovery", minPace: 250, maxPace: 394 },
        { zone: 2, name: "Aerobic", minPace: 250, maxPace: 349 },
        { zone: 3, name: "Tempo", minPace: 250, maxPace: 285 },
        { zone: 4, name: "Threshold", minPace: 250, maxPace: 284 },
        { zone: 5, name: "VO2 Max", minPace: 210, maxPace: 249 },
      ];
      const t2gSwimmingPace = [
        { zone: 1, name: "Recovery", minPace: 92, maxPace: 140 },
        { zone: 2, name: "Aerobic", minPace: 92, maxPace: 118 },
        { zone: 3, name: "Tempo", minPace: 92, maxPace: 108 },
        { zone: 4, name: "Threshold", minPace: 92, maxPace: 99 },
        { zone: 5, name: "VO2 Max", minPace: 86, maxPace: 91 },
      ];
      // Seed `sportZones` to MATCH the snapshot exactly. If the
      // profile lacks a table the snapshot says was synced (e.g.
      // cycling.powerZones present in snapshot but missing in
      // sportZones), the next reconcile classifies it as "empty"
      // and silent-fills — which would make the idempotence
      // assertion fail because the profile DID change post-click.
      const train2goPower = {
        method: "train2go",
        zones: t2gCyclingPower.map((z) => ({ ...z })),
      };
      const train2goRunPace = {
        method: "train2go",
        zones: t2gRunningPace.map((z) => ({ ...z })),
      };
      const train2goSwimPace = {
        method: "train2go",
        zones: t2gSwimmingPace.map((z) => ({ ...z })),
      };
      await db.table("profiles").put({
        id: profileId,
        name: "Train2Go-Synced-Clean E2E",
        sportZones: {
          cycling: {
            thresholds: { ftp: 268, lthr: 174 },
            heartRateZones: { ...cyclingHr },
            powerZones: { ...train2goPower },
          },
          running: {
            // Seed threshold scalars to match what reconcileThresholds
            // would write so the silent no-op stays a no-op.
            // running.thresholds.lthr from running Specific (168);
            // thresholdPace from running pace Z4 upper 4:10 → 250s.
            thresholds: { lthr: 168, thresholdPace: 250 },
            heartRateZones: { ...train2goHr },
            paceZones: { ...train2goRunPace },
          },
          swimming: {
            // swimming.thresholds.lthr falls back to Generic z4Upper
            // (174) per the Specific→Generic chain; swim pace Z4
            // upper 1:32 → 92s.
            thresholds: { lthr: 174, thresholdPace: 92 },
            heartRateZones: { ...train2goHr },
            paceZones: { ...train2goSwimPace },
          },
        },
        linkedAccounts: [
          {
            source: "train2go",
            externalUserId: "99999",
            externalUserName: "Test User",
            linkedAt: ts,
            syncZones: true,
            lastSyncedZonesSnapshot: {
              syncedAt: ts,
              cyclingHr: t2gHrBands.map((z) => ({ ...z })),
              runningHr: t2gHrBands.map((z) => ({ ...z })),
              swimmingHr: t2gHrBands.map((z) => ({ ...z })),
              cyclingPower: t2gCyclingPower.map((z) => ({ ...z })),
              runningPace: t2gRunningPace.map((z) => ({ ...z })),
              swimmingPace: t2gSwimmingPace.map((z) => ({ ...z })),
            },
          },
        ],
        createdAt: ts,
        updatedAt: ts,
      });
      await db.table("integrationPolicies").put({
        id: "zones-sync-planned-session-route",
        profileId,
        dataType: "planned-session",
        bridgeId: "train2go-bridge",
        direction: "import",
        mode: "auto",
        enabled: true,
        updatedAt: ts,
      });
      await db.table("integrationPolicies").put({
        id: "zones-sync-auto-policy",
        profileId,
        dataType: "training-zones",
        bridgeId: "train2go-bridge",
        direction: "import",
        mode: "auto",
        enabled: true,
        updatedAt: ts,
      });

      // Recent coachingSyncState — `isStale(lastSyncedAt, now)`
      // returns false when `now - parsed < 10min`. We pin it to
      // "right now" so the week auto-sync skips on mount. The zones
      // import still runs once per mount — it is gated only on the
      // training-zones policy (see case (i)).
      await db.table("coachingSyncState").put({
        source: "train2go",
        profileId,
        lastSyncedAt: new Date().toISOString(),
      });

      await db.table("workouts").put({
        id: "zones-sync-dummy-workout-i",
        profileId,
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
      editedZ4Max: editedCyclingZ4MaxBpm,
      editedZone: MANUAL_HR_BAND_ZONE,
    }
  );
};

type ProfileSnapshot = {
  sportZones: {
    cycling?: {
      thresholds: { ftp?: number };
      heartRateZones?: {
        method?: string;
        zones?: { minBpm: number; maxBpm: number }[];
      };
    };
    running?: { heartRateZones?: { method?: string } };
    swimming?: { heartRateZones?: { method?: string } };
  };
  linkedAccounts?: { lastSyncedZonesSnapshot?: { syncedAt?: string } }[];
};

const readWeighIns = async (
  page: Page
): Promise<Array<{ date: string; kg: number; source?: string }>> =>
  page.evaluate(async (profileId) => {
    type Row = {
      profileId: string;
      date: string;
      sourceBridgeId?: string;
      krd: { weightKilograms: number };
    };
    type Db = { table: (n: string) => { toArray: () => Promise<Row[]> } };
    const db = (window as unknown as Record<string, unknown>)
      .__KAIORD_DB__ as Db;
    const rows = await db.table("healthWeight").toArray();
    return rows
      .filter((r) => r.profileId === profileId)
      .map((r) => ({
        date: r.date,
        kg: r.krd.weightKilograms,
        source: r.sourceBridgeId,
      }));
  }, PROFILE_ID);

// The browser's local calendar day, the day the SPA stamps a weigh-in with.
const localToday = async (page: Page): Promise<string> =>
  page.evaluate(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  });

const countBridgeAction = async (page: Page, action: string): Promise<number> =>
  page.evaluate((name) => {
    const calls =
      ((window as unknown as Record<string, unknown>).__T2G_STUB_CALLS__ as
        { action: string }[] | undefined) ?? [];
    return calls.filter((c) => c.action === name).length;
  }, action);

const readProfile = async (page: Page): Promise<ProfileSnapshot> =>
  page.evaluate(async (id) => {
    type Db = {
      table: (n: string) => { get: (k: string) => Promise<unknown> };
    };
    const db = (window as unknown as Record<string, unknown>)
      .__KAIORD_DB__ as Db;
    return (await db.table("profiles").get(id)) as ProfileSnapshot;
  }, PROFILE_ID);

const waitForCyclingFtp = async (page: Page): Promise<void> => {
  // Wait until the orchestrator's reconcile is fully committed AND
  // the resulting state is STABLE (two consecutive reads with the
  // same Z1 maxBpm). Stability check guards against a window where
  // the orchestrator has fired sync-zones but a downstream
  // syncWeek/coachingSyncState put — or a React re-render
  // triggering a second pass — could still overwrite the profile
  // mid-test.
  await page.waitForFunction(
    async ({ profileId, expectedFtp, rereadTickMs }) => {
      type Db = {
        table: (n: string) => {
          get: (id: string) => Promise<
            | {
                sportZones?: {
                  cycling?: {
                    thresholds?: { ftp?: number };
                    heartRateZones?: {
                      zones?: { minBpm: number; maxBpm: number }[];
                    };
                  };
                };
                linkedAccounts?: {
                  lastSyncedZonesSnapshot?: { syncedAt?: string };
                }[];
              }
            | undefined
          >;
        };
      };
      const db = (window as unknown as Record<string, unknown>)
        .__KAIORD_DB__ as Db;
      const p1 = await db.table("profiles").get(profileId);
      const ok1 =
        p1?.sportZones?.cycling?.thresholds?.ftp === expectedFtp &&
        Boolean(p1?.linkedAccounts?.[0]?.lastSyncedZonesSnapshot?.syncedAt) &&
        (p1?.sportZones?.cycling?.heartRateZones?.zones?.[0]?.minBpm ?? 0) > 0;
      if (!ok1) return false;
      // Sleep a tick, re-read, require identical Z1 max as proof
      // that no pending write is in flight.
      await new Promise((r) => setTimeout(r, rereadTickMs));
      const p2 = await db.table("profiles").get(profileId);
      return (
        p1?.sportZones?.cycling?.heartRateZones?.zones?.[0]?.maxBpm ===
        p2?.sportZones?.cycling?.heartRateZones?.zones?.[0]?.maxBpm
      );
    },
    {
      profileId: PROFILE_ID,
      expectedFtp: FIXTURE_CYCLING_FTP,
      rereadTickMs: STABILITY_REREAD_TICK_MS,
    },
    { timeout: 10_000 }
  );
};
