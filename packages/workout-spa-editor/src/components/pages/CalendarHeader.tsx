/**
 * Top-of-page banners + batch cost confirmation + the navigation row. Kept
 * out of CalendarPage so each render function stays under the per-function
 * line cap.
 */

import type { useCoachingActivities } from "../../hooks/use-coaching-activities";
import type { CalendarView } from "../../types/user-preferences";
import { BatchCostConfirmation } from "../organisms/BatchCostConfirmation";
import { CalendarEmptyBanners } from "./CalendarEmptyBanners";
import { CalendarNavRow } from "./CalendarNavRow";
import type { useCalendarState } from "./use-calendar-state";
import { useLatestSessionDate } from "./use-latest-session-date";

export type CalendarHeaderProps = {
  state: ReturnType<typeof useCalendarState>;
  coaching: ReturnType<typeof useCoachingActivities>;
  view?: CalendarView;
  onViewChange?: (next: CalendarView) => void;
};

export function CalendarHeader({
  state: s,
  coaching,
  view,
  onViewChange,
}: CalendarHeaderProps) {
  const latestDate = useLatestSessionDate(s.latestWorkout?.date);
  return (
    <>
      <CalendarEmptyBanners
        weekId={s.data.weekId}
        hasAnyWorkouts={s.hasAnyWorkouts}
        hasWeekWorkouts={s.hasWeekWorkouts}
        readyCount={s.readyCount}
        hasAiProvider={s.hasAiProvider}
        extensionInstalled={s.extensionInstalled}
        rawCount={s.data.rawCount}
        latestDate={latestDate}
        onGoToLatest={s.latestWorkout ? s.handleGoToLatest : undefined}
        batchMessage={s.batch.message}
        onDismissBatch={s.batch.dismissMessage}
        batchIsProcessing={s.batch.isProcessing}
        batchProgress={s.batch.progress}
        onBatchProcess={s.batch.requestStart}
        onBatchCancel={s.batch.cancel}
      />
      <BatchCostConfirmation
        open={s.batch.pending !== null}
        workouts={s.batch.pending?.workouts ?? []}
        provider={s.batch.pending?.provider ?? null}
        onConfirm={s.batch.confirmStart}
        onCancel={s.batch.cancelRequest}
      />
      <CalendarNavRow
        weekId={s.data.weekId}
        days={s.data.days}
        coaching={coaching}
        view={view}
        onViewChange={onViewChange}
      />
    </>
  );
}
