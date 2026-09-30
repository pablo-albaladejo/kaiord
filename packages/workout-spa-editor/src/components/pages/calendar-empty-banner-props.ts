import type { useCoachingActivities } from "../../hooks/use-coaching-activities";
import type { CalendarEmptyBannersProps } from "./CalendarEmptyBanners";
import type { useCalendarState } from "./use-calendar-state";

/** Maps the calendar page state onto the week's status banners. */
export const calendarEmptyBannerProps = (
  s: ReturnType<typeof useCalendarState>,
  coaching: ReturnType<typeof useCoachingActivities>,
  latestDate: string | undefined,
  planCount: number | undefined
): CalendarEmptyBannersProps => ({
  weekId: s.data.weekId,
  hasAnyWorkouts: s.hasAnyWorkouts,
  hasWeekWorkouts: s.hasWeekWorkouts,
  readyCount: s.readyCount,
  hasAiProvider: s.hasAiProvider,
  extensionInstalled: s.extensionInstalled,
  rawCount: s.data.rawCount,
  planCount,
  sourceLinked: coaching.syncSources.some((src) => src.linked),
  latestDate,
  onGoToLatest: s.latestWorkout ? s.handleGoToLatest : undefined,
  batchMessage: s.batch.message,
  onDismissBatch: s.batch.dismissMessage,
  batchIsProcessing: s.batch.isProcessing,
  batchProgress: s.batch.progress,
  onBatchProcess: s.batch.requestStart,
  onBatchCancel: s.batch.cancel,
});
