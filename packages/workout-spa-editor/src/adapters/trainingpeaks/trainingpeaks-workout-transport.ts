/**
 * TrainingPeaks bridge workout-write transport.
 *
 * Relays `push-workout` to the discovered trainingpeaks-bridge extension. The
 * payload is built SPA-side by `krdToTrainingPeaksWorkout` in
 * @kaiord/trainingpeaks and relayed verbatim — in particular its `structure`
 * field is already a JSON string, which the API requires and this layer must
 * not re-encode.
 *
 * Sits beside `trainingpeaks-transport.ts` (session + metric reads) rather
 * than inside it, mirroring the per-operation split on the Garmin side.
 */
import { z } from "zod";

import { sendBridgeMessage } from "../bridge/bridge-transport";
import { TrainingPeaksBridgeError } from "./trainingpeaks-transport";

/** Generous: the write is a single POST, but a cold service worker is slow. */
const PUSH_WORKOUT_TIMEOUT_MS = 20_000;

/** TrainingPeaks echoes the whole created workout; only the id is load-bearing. */
const pushedWorkoutSchema = z.object({ workoutId: z.number() });

/**
 * Creates a structured planned workout on the athlete's TrainingPeaks
 * calendar and returns its TrainingPeaks id.
 *
 * A `workoutDay` beyond the account's planning horizon fails with the
 * bridge's own 402 message rather than a generic error — on a Basic account
 * that horizon is one day ahead, measured in the athlete's timezone.
 */
export const pushTrainingPeaksWorkout = async (
  extensionId: string,
  workout: Record<string, unknown>
): Promise<number> => {
  const res = await sendBridgeMessage(
    extensionId,
    { action: "push-workout", workout },
    PUSH_WORKOUT_TIMEOUT_MS
  );
  if (!res.ok) {
    throw new TrainingPeaksBridgeError(
      res.error ?? "TrainingPeaks workout push failed",
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

const READ_WORKOUT_TIMEOUT_MS = 10_000;
const NOT_FOUND_STATUS = 404;

export type TrainingPeaksCopyState = "present" | "gone" | "unknown";

/**
 * Reads one workout Kaiord created, to learn whether TrainingPeaks still
 * holds it. Only a 404 means gone; any other failure is "unknown", which a
 * caller must treat as present so it never adds a second copy.
 */
export const readTrainingPeaksCopyState = async (
  extensionId: string,
  workoutId: string
): Promise<TrainingPeaksCopyState> => {
  const res = await sendBridgeMessage(
    extensionId,
    { action: "read-workout", workoutId },
    READ_WORKOUT_TIMEOUT_MS
  );
  if (res.ok) return "present";
  return res.status === NOT_FOUND_STATUS ? "gone" : "unknown";
};
