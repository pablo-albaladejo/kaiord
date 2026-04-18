/**
 * CalendarHeader — top-of-page banners + batch cost confirmation +
 * week navigation row. Kept out of CalendarPage so its render
 * function stays under the max-lines-per-function rule.
 */

import type { useCoachingActivities } from "../../hooks/use-coaching-activities";
import { CoachingSyncButton } from "../molecules/CoachingCard/CoachingSyncButton";
import { WeekNavigation } from "../molecules/WorkoutCard/WeekNavigation";
import { BatchCostConfirmation } from "../organisms/BatchCostConfirmation";
import { CalendarEmptyBanners } from "./CalendarEmptyBanners";
import type { useCalendarState } from "./use-calendar-state";

export type CalendarHeaderProps = {
  state: ReturnType<typeof useCalendarState>;
  coaching: ReturnType<typeof useCoachingActivities>;
};

export function CalendarHeader({ state: s, coaching }: CalendarHeaderProps) {
  return (
    <>
      <CalendarEmptyBanners
        hasAnyWorkouts={s.hasAnyWorkouts}
        hasWeekWorkouts={s.hasWeekWorkouts}
        hasReadyWorkouts={s.hasReadyWorkouts}
        hasAiProvider={s.hasAiProvider}
        extensionInstalled={s.extensionInstalled}
        rawCount={s.data.rawCount}
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
      <div className="flex items-center justify-between">
        <WeekNavigation
          weekId={s.data.weekId}
          weekLabel={s.data.weekId.replace("-W", " W")}
        />
        <div className="flex gap-2">
          {coaching.syncSources.map((src) => (
            <CoachingSyncButton
              key={src.id}
              connected={src.connected}
              loading={src.loading}
              error={src.error}
              onSync={() => src.sync(s.data.days[0])}
              onConnect={src.connect}
              label={src.label}
            />
          ))}
        </div>
      </div>
    </>
  );
}
