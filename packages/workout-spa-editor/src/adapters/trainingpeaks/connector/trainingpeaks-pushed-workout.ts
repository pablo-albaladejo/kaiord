/**
 * The answer to a workout write: TrainingPeaks echoes the whole created
 * workout and only its id is load-bearing. A 402 is TrainingPeaks refusing
 * the day (the account's planning horizon), not a bad payload, so it keeps
 * its own message and status.
 */
import { z } from "zod";

import type { ExtensionResponse } from "../../bridge/bridge-transport";
import { answerOrThrow } from "../../bridge/connector-call";
import { TrainingPeaksBridgeError } from "./trainingpeaks-transport";

const PLANNING_HORIZON_STATUS = 402;
const PLANNING_HORIZON =
  "TrainingPeaks refused the date: planning that far ahead needs a paid account";

const pushedWorkoutSchema = z.object({ workoutId: z.number() });

export const pushedWorkoutId = (res: ExtensionResponse): number => {
  answerOrThrow(
    res,
    "TrainingPeaks workout push failed",
    (failure) =>
      new TrainingPeaksBridgeError(
        failure.status === PLANNING_HORIZON_STATUS
          ? PLANNING_HORIZON
          : failure.message,
        failure.needsReauth,
        failure.delivered,
        failure.status
      )
  );
  const parsed = pushedWorkoutSchema.safeParse(res.data);
  if (!parsed.success) {
    throw new TrainingPeaksBridgeError(
      "TrainingPeaks accepted the workout but returned no id"
    );
  }
  return parsed.data.workoutId;
};
