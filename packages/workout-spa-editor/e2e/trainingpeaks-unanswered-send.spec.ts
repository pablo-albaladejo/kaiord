/**
 * A send to TrainingPeaks whose answer never arrived, end to end through a
 * stub of Kaiord for TrainingPeaks: the workout landed, the App gave up
 * waiting. The next send reads that day first, finds a workout of the same
 * title, sends nothing and says it may already be there; "Send anyway"
 * sends it. Nothing on TrainingPeaks is ever changed or deleted.
 */
import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import { seedEnabledGarminExportPolicy } from "./helpers/garmin-ready-gate";
import {
  clearDexie,
  E2E_DEFAULT_PROFILE_ID,
  makeWorkout,
  seedDefaultProfile,
  seedWorkouts,
} from "./helpers/seed-dexie";
import {
  installTrainingPeaksBridgeStub,
  readTrainingPeaksStub,
} from "./helpers/trainingpeaks-bridge-stub";

/** Longer than the App's wait for a send's answer (20 s). */
const NO_ANSWER_TIMEOUT_MS = 30_000;
const SPEC_TIMEOUT_MS = 120_000;
const MAY_BE_THERE = "may already be on TrainingPeaks";

const sendButton = (page: Page) =>
  page.getByTestId("send-to-trainingpeaks-button");

const openReadyWorkout = async (page: Page, hangPushes: number) => {
  await installTrainingPeaksBridgeStub(page, { hangPushes });
  await page.goto("/calendar");
  await clearDexie(page);
  await seedDefaultProfile(page);
  await seedEnabledGarminExportPolicy(
    page,
    E2E_DEFAULT_PROFILE_ID,
    "trainingpeaks-bridge"
  );
  const workout = makeWorkout({ state: "ready" });
  await seedWorkouts(page, [workout]);
  await page.goto(`/workout/view/${workout.id}`);
  await expect(sendButton(page)).toBeEnabled({ timeout: 15_000 });
};

const writes = async (page: Page) =>
  ((await readTrainingPeaksStub(page))?.requests ?? [])
    .filter((r) => r.method !== "GET")
    .map((r) => r.method);

test.describe("TrainingPeaks — a send that got no answer", () => {
  test.setTimeout(SPEC_TIMEOUT_MS);

  test("should ask before sending again, and send only when the athlete chooses to", async ({
    page,
  }) => {
    // Arrange
    await openReadyWorkout(page, 1);
    await sendButton(page).click();
    await expect(sendButton(page)).toBeEnabled({
      timeout: NO_ANSWER_TIMEOUT_MS,
    });

    // Act
    await sendButton(page).click();

    // Assert
    await expect(page.getByTestId("trainingpeaks-unanswered")).toContainText(
      MAY_BE_THERE
    );
    expect(await writes(page)).toEqual(["POST"]);
    await page.getByRole("button", { name: "Send anyway" }).click();
    await expect(page.getByText("On TrainingPeaks")).toBeVisible();
    const state = await readTrainingPeaksStub(page);
    expect(state?.workouts).toHaveLength(2);
    expect(await writes(page)).toEqual(["POST", "POST"]);
  });

  test("should send at once when the day holds nothing of that title", async ({
    page,
  }) => {
    // Arrange
    await openReadyWorkout(page, 0);

    // Act
    await sendButton(page).click();

    // Assert
    await expect(page.getByText("On TrainingPeaks")).toBeVisible();
    await expect(page.getByTestId("trainingpeaks-unanswered")).toHaveCount(0);
    const state = await readTrainingPeaksStub(page);
    expect(
      state?.requests.some((r) => /\/\d{4}-\d{2}-\d{2}\//.test(r.path))
    ).toBe(false);
  });
});
