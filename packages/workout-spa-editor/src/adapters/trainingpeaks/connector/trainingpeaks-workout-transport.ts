/**
 * TrainingPeaks bridge workout transport: the structured-workout write and
 * the read of one workout Kaiord created, through `request` (protocol 2) or
 * the legacy `push-workout` / `read-workout` actions (protocol 1).
 *
 * The payload is built SPA-side by `krdToTrainingPeaksWorkout` in
 * @kaiord/trainingpeaks and sent verbatim — in particular its `structure`
 * field is already a JSON string, which the API requires and this layer must
 * not re-encode. The extension checks it against its declared schema.
 */
import type { LiveState } from "../../../application/safe-writes/live-state";
import { callConnector, readJson } from "../../bridge/connector-call";
import type { BridgeCall } from "../../bridge/thin-bridge-request";
import { readWorkoutIdentity } from "./read-trainingpeaks-answers";
import { readTrainingPeaksAthleteId } from "./trainingpeaks-athlete-transport";
import { workoutPath, workoutsPath } from "./trainingpeaks-paths";
import { pushedWorkoutId } from "./trainingpeaks-pushed-workout";

/** Generous: the write is a single POST, but a cold service worker is slow. */
const PUSH_WORKOUT_TIMEOUT_MS = 20_000;
const READ_WORKOUT_TIMEOUT_MS = 10_000;
const NOT_FOUND_STATUS = 404;
const WORKOUT_ID = /^\d+$/;

const call = <T>(extensionId: string, timeoutMs: number, c: BridgeCall<T>) =>
  callConnector(extensionId, c, timeoutMs);

/**
 * Creates a structured planned workout on the athlete's TrainingPeaks
 * calendar and returns its TrainingPeaks id. A `workoutDay` beyond the
 * account's planning horizon is refused with a 402: that horizon is
 * one day ahead on a Basic account, measured in the athlete's timezone.
 */
export const pushTrainingPeaksWorkout = async (
  extensionId: string,
  workout: Record<string, unknown>
): Promise<number> =>
  pushedWorkoutId(
    await call(extensionId, PUSH_WORKOUT_TIMEOUT_MS, {
      method: "POST",
      path: workoutsPath(Number(workout.athleteId)),
      body: workout,
      legacy: { action: "push-workout", workout },
      read: readJson,
    })
  );

/**
 * Reads one workout Kaiord created, to learn whether TrainingPeaks still
 * holds it, on the path of the athlete the send is built against (read
 * when not given). Only a 404 means absent; any other failure is "unknown", which
 * a caller must treat as present so it never adds a second copy.
 */
const athleteFor = (extensionId: string, known: unknown) =>
  typeof known === "number" && Number.isSafeInteger(known) && known > 0
    ? Promise.resolve(known)
    : readTrainingPeaksAthleteId(extensionId).catch(() => null);

export const readTrainingPeaksCopyState = async (
  extensionId: string,
  workoutId: string,
  knownAthleteId?: unknown
): Promise<LiveState> => {
  if (!WORKOUT_ID.test(workoutId)) return "unknown";
  const athleteId = await athleteFor(extensionId, knownAthleteId);
  if (athleteId === null) return "unknown";
  const res = await call(extensionId, READ_WORKOUT_TIMEOUT_MS, {
    method: "GET",
    path: workoutPath(athleteId, workoutId),
    legacy: { action: "read-workout", workoutId, athleteId },
    read: readWorkoutIdentity,
  });
  if (res.ok) return "present";
  return res.status === NOT_FOUND_STATUS ? "absent" : "unknown";
};
