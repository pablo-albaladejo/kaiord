/**
 * Garmin calendar placement (T5): the pipeline end to end through the bridge
 * stub, whose in-memory Garmin account is shared by every page of the
 * context and survives a reload.
 *
 * - AC-30: a second tab pushing the same workout gets `busy` with 0 calls.
 * - AC-29: a reload during an unanswered schedule never schedules twice.
 *
 * The in-flight windows are held by the stub, not timed: a held action
 * commits and answers only when the test releases it.
 * - AC-34: an older bridge is library-only; a bridge without `calendar-find`
 *   answers an ambiguous schedule with `uncertain`, which the editor keeps
 *   across a reload until the athlete answers it.
 */

import type { BrowserContext, Page } from "@playwright/test";

import { appUrl, expect, test } from "./fixtures/base";
import {
  garminStubActions,
  type GarminStubOptions,
  installGarminBridgeStub,
  readGarminStubState,
  releaseGarminStub,
} from "./helpers/garmin-bridge-stub";
import { openDetailWhenReady } from "./helpers/garmin-calendar-seed";
import { seedEnabledGarminExportPolicy } from "./helpers/garmin-ready-gate";
import {
  clearDexie,
  E2E_DEFAULT_PROFILE_ID,
  getWeekDates,
  makeWorkout,
  seedDefaultProfile,
  seedWorkouts,
} from "./helpers/seed-dexie";

const GARMIN_BRIDGE_STORE_URL =
  "https://chromewebstore.google.com/detail/kaiord-garmin-bridge/innelncjhkdokailkinkchppgekennoe";
const PLACEMENT_TIMEOUT_MS = 20_000;
/** The SPA's `SETTLE_MS` and `POST_GATE_MS`, passed on the page clock. */
const SETTLE_MS = 3_000;
const POST_GATE_MS = 38_000;
const AMBIGUOUS_500 = {
  response: {
    ok: false,
    protocolVersion: 1,
    error: "Schedule failed",
    status: 500,
  },
  commit: true,
};

/** A ready workout behind the full send gate, opened in the editor. */
const openReadyWorkout = async (
  page: Page,
  target: Page | BrowserContext,
  options: GarminStubOptions = {}
) => {
  await installGarminBridgeStub(target, options);
  await page.goto("/calendar");
  await clearDexie(page);
  await seedDefaultProfile(page);
  await seedEnabledGarminExportPolicy(page, E2E_DEFAULT_PROFILE_ID);
  const workoutId = crypto.randomUUID();
  await seedWorkouts(page, [
    makeWorkout({ id: workoutId, date: getWeekDates()[0], state: "ready" }),
  ]);
  await page.goto(`/workout/${workoutId}`);
  await expect(page.getByTestId("send-to-garmin-button")).toBeVisible();
  return workoutId;
};

const ribbon = (page: Page) => page.getByTestId("editor-state-ribbon");

test.describe("Garmin calendar placement", () => {
  test("should make one library push and no calendar call with an older bridge (AC-34)", async ({
    page,
  }) => {
    // Arrange
    await openReadyWorkout(page, page, { features: null });

    // Act
    await page.getByTestId("send-to-garmin-button").click();

    // Assert
    await expect(ribbon(page)).toContainText(
      "update the Kaiord Garmin Bridge extension"
    );
    await expect(
      ribbon(page).getByRole("link", { name: "Update the extension" })
    ).toHaveAttribute("href", GARMIN_BRIDGE_STORE_URL);
    expect(await garminStubActions(page)).toEqual(["push"]);
  });

  test("should keep an uncertain placement across a reload until the athlete confirms it (AC-34)", async ({
    page,
  }) => {
    // Arrange
    await page.clock.install();
    await openReadyWorkout(page, page, {
      features: ["calendar-write-v1"],
      failures: { schedule: [AMBIGUOUS_500] },
    });
    await page.getByTestId("send-to-garmin-button").click();
    await expect.poll(() => garminStubActions(page)).toContain("schedule");
    await page.clock.fastForward(SETTLE_MS);
    await expect(ribbon(page)).toContainText("Garmin did not confirm");

    // Act
    await page.reload();
    await expect(ribbon(page)).toContainText("Still checking Garmin");
    await page.clock.fastForward(POST_GATE_MS);
    await ribbon(page).getByRole("button", { name: "It's in Garmin" }).click();

    // Assert
    await expect(ribbon(page)).toHaveCount(0);
    expect(await garminStubActions(page)).toEqual(["push", "schedule"]);
    expect((await readGarminStubState(page))?.entries).toHaveLength(1);
  });

  test("should answer busy with no call in a second tab while the first sends (AC-30)", async ({
    page,
    context,
  }) => {
    // Arrange
    const workoutId = await openReadyWorkout(page, context, {
      holds: ["push"],
    });
    const second = await context.newPage();
    await second.goto(appUrl(`/workout/${workoutId}`));
    await expect(second.getByTestId("send-to-garmin-button")).toBeVisible();
    await page.getByTestId("send-to-garmin-button").click();
    await expect.poll(() => garminStubActions(page)).toContain("push");

    // Act
    await second.getByTestId("send-to-garmin-button").click();

    // Assert
    await expect(ribbon(second)).toContainText("already being sent");
    expect(await garminStubActions(page)).toEqual(["push"]);
    await releaseGarminStub(page);
    await expect
      .poll(() => garminStubActions(page), { timeout: PLACEMENT_TIMEOUT_MS })
      .toEqual(["push", "schedule"]);
    expect((await readGarminStubState(page))?.entries).toHaveLength(1);
  });

  test("should never schedule twice after a reload during an unanswered schedule (AC-29)", async ({
    page,
  }) => {
    // Arrange
    const workoutId = await openReadyWorkout(page, page, {
      holds: ["schedule"],
    });
    await page.getByTestId("send-to-garmin-button").click();
    await expect.poll(() => garminStubActions(page)).toContain("schedule");
    await page.reload();

    // Act
    await openDetailWhenReady(page, workoutId);
    await page.getByRole("button", { name: /send to garmin/i }).click();

    // Assert
    await expect(
      page.getByRole("button", { name: "On your Garmin" })
    ).toBeVisible({
      timeout: PLACEMENT_TIMEOUT_MS,
    });
    const actions = await garminStubActions(page);
    expect(actions.filter((a) => a === "schedule")).toHaveLength(1);
    expect(actions).toContain("calendar-find");
    expect((await readGarminStubState(page))?.entries).toHaveLength(1);
  });
});
