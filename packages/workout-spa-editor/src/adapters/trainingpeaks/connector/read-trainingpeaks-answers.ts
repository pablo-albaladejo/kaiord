/**
 * Reading TrainingPeaks' raw answers, which the TrainingPeaks Bridge hands
 * over unread: metric JSON as it came (its shape is validated by
 * `trainingPeaksMetricsToKrd` in @kaiord/trainingpeaks), the id of a
 * created workout, and of one workout Kaiord created only its id and day —
 * its title, notes and what the athlete recorded are dropped here.
 */
import { readJson } from "../../bridge/connector-call";
import type { RawAnswer } from "../../bridge/thin-bridge-request";

export const readWorkoutIdentity = (
  answer: RawAnswer
): { workoutId: unknown; workoutDay: unknown } => {
  const data = readJson(answer) as {
    workoutId?: unknown;
    workoutDay?: unknown;
  } | null;
  return { workoutId: data?.workoutId, workoutDay: data?.workoutDay };
};
