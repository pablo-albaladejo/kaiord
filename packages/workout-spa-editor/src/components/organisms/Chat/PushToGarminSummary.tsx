import { useWorkoutLabelLive } from "../../../hooks/use-workout-label-live";
import type { Translate } from "../../../i18n/use-translate";
import { text } from "./action-input";

export type PushToGarminSummaryProps = {
  input: unknown;
  t: Translate;
  formatDay: (day: string) => string;
};

/** Names the workout a `push_to_garmin` call would send, resolved from the
 * active athlete's library, so the user never approves a bare id. */
export function PushToGarminSummary({
  input,
  t,
  formatDay,
}: PushToGarminSummaryProps) {
  const workoutId =
    input !== null && typeof input === "object"
      ? (text(input as Record<string, unknown>, "workoutId") ?? "")
      : "";
  const workout = useWorkoutLabelLive(workoutId, t("proposal.untitled"));

  if (workout === undefined) return <>{t("summary.pushLoading")}</>;
  if (workout === null) return <>{t("summary.pushMissing")}</>;
  return (
    <>
      {t("summary.push", {
        title: workout.title,
        duration: workout.duration,
        date: formatDay(workout.date),
      })}
    </>
  );
}
