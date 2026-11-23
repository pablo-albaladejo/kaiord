/**
 * The answer to a workout write: TrainingPeaks echoes the whole created
 * workout and only its id is load-bearing. A 402 is TrainingPeaks refusing
 * the day (the account's planning horizon), not a bad payload, so it keeps
 * its own message and status.
 */
import { z } from "zod";

import type { ExtensionResponse } from "../bridge/bridge-transport";
import { TrainingPeaksBridgeError } from "./trainingpeaks-transport";

const PLANNING_HORIZON_STATUS = 402;
const PLANNING_HORIZON =
  "TrainingPeaks refused the date: planning that far ahead needs a paid account";

const pushedWorkoutSchema = z.object({ workoutId: z.number() });

export const pushedWorkoutId = (res: ExtensionResponse): number => {
  if (!res.ok) {
    const error =
      res.status === PLANNING_HORIZON_STATUS
        ? PLANNING_HORIZON
        : (res.error ?? "TrainingPeaks workout push failed");
    throw new TrainingPeaksBridgeError(
      error,
      res.needsReauth === true,
      res.delivered !== false,
      res.status
    );
  }
  const parsed = pushedWorkoutSchema.safeParse(res.data);
  if (!parsed.success) {
    throw new TrainingPeaksBridgeError(
      "TrainingPeaks accepted the workout but returned no id"
    );
  }
  return parsed.data.workoutId;
};
