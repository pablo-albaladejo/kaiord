/**
 * Pure helpers for `useCoachingAi`. Lives in a separate file so the
 * hook stays under the line caps. No React: runs the use case end-to-end
 * behind a single async function.
 */
import type { Analytics } from "@kaiord/core";

import { convertCoachingActivityWithAi } from "../../../application/coaching/convert-coaching-activity-with-ai";
import { createReadStepsTable } from "../../../application/coaching/read-steps-table";
import type { GenerationDeps } from "../../../lib/generate-workout";
import {
  type AiRunHooks,
  buildGenerateKrdPort,
  type ChooseAiModel,
} from "./coaching-generate-krd-port";

const isoNow = (): string => new Date().toISOString();

export type RunAiInput = AiRunHooks & {
  activityId: string;
  chooseModel: ChooseAiModel;
  abortSignal: AbortSignal;
  /** Rebuild the existing Workout in place (explicit). */
  regenerate?: boolean;
  deps: GenerationDeps;
  analytics: Analytics;
};

export const runConvertWithAi = (input: RunAiInput) =>
  convertCoachingActivityWithAi(
    {
      activityId: input.activityId,
      abortSignal: input.abortSignal,
      regenerate: input.regenerate,
    },
    {
      coaching: input.deps.persistence.coaching,
      workouts: input.deps.persistence.workouts,
      sessionMatches: input.deps.persistence.sessionMatch,
      athleteNotes: input.deps.persistence.athleteNotes,
      transaction: input.deps.persistence.transaction,
      analytics: input.analytics,
      generateKrd: buildGenerateKrdPort(
        input.deps,
        input.chooseModel,
        isoNow,
        input
      ),
      readStepsTable: createReadStepsTable(isoNow),
      newWorkoutId: () => crypto.randomUUID(),
      newMatchId: () => crypto.randomUUID(),
      clock: isoNow,
    }
  );
