/**
 * Reading TrainingPeaks' raw answers, which the TrainingPeaks Bridge hands
 * over unread: metric JSON as it came (its shape is validated by
 * `trainingPeaksMetricsToKrd` in @kaiord/trainingpeaks), the id of a
 * created workout, and of one workout Kaiord created only its id and day —
 * its title, notes and what the athlete recorded are dropped here. Of one
 * day of workouts only the titles of those on that day are kept; a payload
 * that is not a list of dated workouts is refused, never "none".
 */
import { readJson } from "../../bridge/connector-call";
import {
  bridgeAnswerRefusal,
  type RawAnswer,
} from "../../bridge/thin-bridge-request";

export const readWorkoutIdentity = (
  answer: RawAnswer
): { workoutId: unknown; workoutDay: unknown } => {
  const data = readJson(answer) as {
    workoutId?: unknown;
    workoutDay?: unknown;
  } | null;
  return { workoutId: data?.workoutId, workoutDay: data?.workoutDay };
};

type DayItem = { workoutDay?: unknown; title?: unknown } | null;

export const readDayTitles =
  (day: string) =>
  (answer: RawAnswer): string[] => {
    let items: unknown;
    try {
      items = readJson(answer);
    } catch {
      items = undefined;
    }
    const dated = Array.isArray(items)
      ? (items as DayItem[]).every((i) => typeof i?.workoutDay === "string")
      : false;
    if (!dated) throw bridgeAnswerRefusal("unexpected-payload");
    return (items as { workoutDay: string; title?: unknown }[])
      .filter((i) => i.workoutDay.slice(0, 10) === day)
      .flatMap((i) => (typeof i.title === "string" ? [i.title] : []));
  };
