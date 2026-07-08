import { useTranslate } from "../../../i18n/use-translate";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingActivity } from "../../../types/coaching-activity";
import { SectionHead } from "../../molecules/SectionHead";
import { renderDayCards } from "../../molecules/WorkoutCard/day-column-cards";
import { type TodayBuckets, todayBucketsEmpty } from "./build-today-buckets";
import { PlannedEmpty } from "./PlannedEmpty";

export type PlannedSessionProps = {
  buckets: TodayBuckets;
  onWorkoutClick: (workout: WorkoutRecord) => void;
  onActivityClick: (activity: CoachingActivity) => void;
};

/** Today's planned section — mirrors the calendar day cell: the same deduped,
    multi-source, KRD-agnostic cards the calendar shows for today, as a list. */
export function PlannedSession({
  buckets,
  onWorkoutClick,
  onActivityClick,
}: PlannedSessionProps) {
  const t = useTranslate("daily");
  return (
    <section data-testid="daily-planned-session">
      <SectionHead title={t("planned.title")} />
      {todayBucketsEmpty(buckets) ? (
        <PlannedEmpty />
      ) : (
        <div className="flex flex-col gap-2">
          {renderDayCards({
            matchedSessions: buckets.matchedSessions,
            soloPlans: buckets.soloPlans,
            soloActuals: buckets.soloActuals,
            view: "list",
            onWorkoutClick,
            onActivityClick,
          })}
        </div>
      )}
    </section>
  );
}
