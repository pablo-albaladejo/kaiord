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
import { getWeekDates, makeWorkout, seedWorkouts } from "./helpers/seed-dexie";
import { waitForDexieReady } from "./helpers/wait-for-dexie-ready";

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
      sportZones: {},
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

    // Assert — no editor GarminPushButton rendered (no enabled policy).
    await expect(
      page.getByRole("button", { name: /push to garmin/i })
    ).toHaveCount(0);
  });

  test("should show the editor push button when an enabled export policy exists", async ({
    page,
  }) => {
    // Verifies AC-5 is enforced again in the editor: with the active
    // profile's enabled workout-export policy resolved (profileId wired
    // into the editor GarminPushButton), the gated button renders.
    const WORKOUT_ID = "garmin-push-editor-workout";
    await installGarminBridgeStub(page);
    await page.goto("/calendar");
    await waitForDexieReady(page);
    await seedProfileBase(page, PROFILE_ID);
    await addExportPolicy(page, PROFILE_ID, GARMIN_BRIDGE_ID);
    await seedWorkouts(page, [
      makeWorkout({
        id: WORKOUT_ID,
        profileId: PROFILE_ID,
        date: getWeekDates()[0],
        state: "ready",
      }),
    ]);

    // Act — open the workout in the editor.
    await page.goto(`/workout/${WORKOUT_ID}`);

    // Assert — the policy-gated editor push button renders.
    await expect(
      page.getByRole("button", { name: /push to garmin/i })
    ).toBeVisible({ timeout: 8_000 });
  });

  test("should show the Push to Garmin button on the workout detail page", async ({
    page,
  }) => {
    // The redesign added a read-only WorkoutDetail page
    // (/workout/view/:id) whose footer always renders "Push to Garmin"
    // (ungated by design for that surface). This asserts that surface;
    // the editor's policy-gated button is covered by the test above.
    const WORKOUT_ID = "garmin-push-detail-workout";
    await installGarminBridgeStub(page);
    await page.goto("/calendar");
    await waitForDexieReady(page);
    await seedProfileBase(page, PROFILE_ID);
    await addExportPolicy(page, PROFILE_ID, GARMIN_BRIDGE_ID);
    await seedWorkouts(page, [
      makeWorkout({
        id: WORKOUT_ID,
        profileId: PROFILE_ID,
        date: getWeekDates()[0],
        state: "ready",
      }),
    ]);

    // Act — open the read-only detail page for the seeded workout.
    await page.goto(`/workout/view/${WORKOUT_ID}`);

    // Assert — the footer push button is present.
    await expect(
      page.getByRole("button", { name: /push to garmin/i })
    ).toBeVisible({ timeout: 8_000 });
  });
});
