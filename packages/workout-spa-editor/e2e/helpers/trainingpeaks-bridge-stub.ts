/**
 * Playwright helper: a stub of the current Kaiord for TrainingPeaks in the
 * page context (extension IPC is not interceptable by `page.route`), and
 * the account it holds.
 */
import type { Page } from "@playwright/test";

import {
  installTrainingPeaksAccountScript,
  installTrainingPeaksAnswersScript,
  TRAININGPEAKS_STUB_STATE_KEY,
} from "./trainingpeaks-stub-account-script";
import { installTrainingPeaksRuntimeScript } from "./trainingpeaks-stub-runtime-script";

export const TRAININGPEAKS_EXTENSION_ID = "trainingpeaks-stub-ext";

/** Call before `page.goto`. `hangPushes` sends land and get no answer. */
export const installTrainingPeaksBridgeStub = async (
  page: Page,
  { hangPushes = 0 }: { hangPushes?: number } = {}
): Promise<void> => {
  await page.addInitScript(installTrainingPeaksAnswersScript);
  await page.addInitScript(installTrainingPeaksAccountScript, { hangPushes });
  await page.addInitScript(installTrainingPeaksRuntimeScript, {
    extensionId: TRAININGPEAKS_EXTENSION_ID,
  });
};

export type TrainingPeaksStubState = {
  workouts: { workoutId: number; title?: string; workoutDay?: string }[];
  requests: { method: string; path: string }[];
};

export const readTrainingPeaksStub = async (
  page: Page
): Promise<TrainingPeaksStubState | null> =>
  page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "null"),
    TRAININGPEAKS_STUB_STATE_KEY
  );
