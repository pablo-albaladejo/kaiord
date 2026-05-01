/**
 * Top-of-page banners + batch cost confirmation + week navigation row +
 * density toggle. Kept out of CalendarPage so each render function
 * stays under the per-function line cap.
 */

import type { useCoachingActivities } from "../../hooks/use-coaching-activities";
import type { CalendarDensity } from "../../types/user-preferences";
import { formatWeekLabel } from "../../utils/format-week-label";
import { CoachingSyncButton } from "../molecules/CoachingCard/CoachingSyncButton";
import { DensityToggle } from "../molecules/DensityToggle/DensityToggle";
import { WeekNavigation } from "../molecules/WorkoutCard/WeekNavigation";
import { BatchCostConfirmation } from "../organisms/BatchCostConfirmation";
import { CalendarEmptyBanners } from "./CalendarEmptyBanners";
import type { useCalendarState } from "./use-calendar-state";

export type CalendarHeaderProps = {
  state: ReturnType<typeof useCalendarState>;
  coaching: ReturnType<typeof useCoachingActivities>;
  density?: CalendarDensity;
  onDensityChange?: (next: CalendarDensity) => void;
};

export function CalendarHeader({
  state: s,
  coaching,
  density,
  onDensityChange,
}: CalendarHeaderProps) {
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
          weekLabel={formatWeekLabel(s.data.weekId)}
        />
        <div className="flex items-center gap-2">
          {density && onDensityChange && (
            <DensityToggle density={density} onToggle={onDensityChange} />
          )}
          {coaching.syncSources
            .filter((src) => src.linked)
            .map((src) => (
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
