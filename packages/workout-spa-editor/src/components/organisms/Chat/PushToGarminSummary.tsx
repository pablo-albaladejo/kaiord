import type { WorkoutLabel } from "../../../hooks/use-workout-label-live";
import type { Translate } from "../../../i18n/use-translate";

export type PushToGarminSummaryProps = {
  /** `useWorkoutLabelLive`'s tri-state, read by the card that gates Approve. */
  workout: WorkoutLabel | null | undefined;
  t: Translate;
  formatDay: (day: string) => string | null;
};

/** Names the workout a `push_to_garmin` call would send, resolved from the
 * active athlete's library, so the user never approves a bare id. */
export function PushToGarminSummary({
  workout,
  t,
  formatDay,
}: PushToGarminSummaryProps) {
  if (workout === undefined) return <>{t("summary.pushLoading")}</>;
  if (workout === null) return <>{t("summary.pushMissing")}</>;
  return (
    <>
      {t("summary.push", {
        title: workout.title,
        duration: workout.duration,
        date: formatDay(workout.date) ?? workout.date,
      })}
    </>
  );
}
