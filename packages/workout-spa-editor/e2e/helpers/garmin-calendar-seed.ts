/**
 * Seeds a profile behind the full Garmin send gate (bridge stub, session,
 * enabled export route) with the given workouts, for the calendar
 * placement specs.
 */
import { type BrowserContext, expect, type Page } from "@playwright/test";

import {
  type GarminStubOptions,
  installGarminBridgeStub,
} from "./garmin-bridge-stub";
import { seedEnabledGarminExportPolicy } from "./garmin-ready-gate";
import {
  clearDexie,
  E2E_DEFAULT_PROFILE_ID,
  seedDefaultProfile,
  seedWorkouts,
} from "./seed-dexie";

export const seedGarminReadyWorkouts = async (
  page: Page,
  workouts: Record<string, unknown>[],
  options: GarminStubOptions = {},
  target: Page | BrowserContext = page
): Promise<void> => {
  await installGarminBridgeStub(target, options);
  await page.goto("/calendar");
  await clearDexie(page);
  await seedDefaultProfile(page);
  await seedEnabledGarminExportPolicy(page, E2E_DEFAULT_PROFILE_ID);
  await seedWorkouts(page, workouts);
};

/** Moves a workout to another day, as a coach sync or a drag would. */
export const moveWorkoutDate = async (
  page: Page,
  workoutId: string,
  date: string
): Promise<void> => {
  await page.evaluate(
    async ({ id, day }) => {
      type Db = {
        table: (n: string) => {
          update: (key: string, changes: unknown) => Promise<number>;
        };
      };
      const db = (window as unknown as Record<string, unknown>)
        .__KAIORD_DB__ as Db;
      await db.table("workouts").update(id, { date: day });
    },
    { id: workoutId, day: date }
  );
};

/**
 * Opens a workout's detail page once the bridge and its Garmin session are
 * detected. The detail page's send button is always shown, and a send
 * before detection is a no-op; the editor shows its send button only once
 * the gate is ready. Going back is in-app, so detection is kept.
 */
export const openDetailWhenReady = async (
  page: Page,
  workoutId: string
): Promise<void> => {
  await page.goto(`/workout/view/${workoutId}`);
  await page.getByRole("button", { name: "Edit" }).click();
  await expect(page.getByTestId("send-to-garmin-button")).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole("button", { name: "Send to Garmin" })
  ).toBeVisible();
};
