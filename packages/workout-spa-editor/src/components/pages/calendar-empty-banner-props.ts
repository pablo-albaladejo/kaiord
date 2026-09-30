import type { CalendarEmptyBannersProps } from "./CalendarEmptyBanners";
import type { useCalendarState } from "./use-calendar-state";

export type CalendarEmptyBannerExtras = {
  latestDate: string | undefined;
  /** The visible week's coaching plans no workout answers yet. */
  planCount: number | undefined;
  /** The profile holds a coaching plan in any week (undefined: loading). */
  hasAnyPlans: boolean | undefined;
  /** The profile has linked any account (the guide's "sources" step). */
  sourceLinked: boolean;
};

/** Maps the calendar page state onto the week's status banners. */
export const calendarEmptyBannerProps = (
  s: ReturnType<typeof useCalendarState>,
  extras: CalendarEmptyBannerExtras
): CalendarEmptyBannersProps => ({
  weekId: s.data.weekId,
  hasAnyWorkouts: s.hasAnyWorkouts,
  hasWeekWorkouts: s.hasWeekWorkouts,
  readyCount: s.readyCount,
  hasAiProvider: s.hasAiProvider,
  extensionInstalled: s.extensionInstalled,
  rawCount: s.data.rawCount,
  ...extras,
  onGoToLatest: s.latestWorkout ? s.handleGoToLatest : undefined,
  batchMessage: s.batch.message,
  onDismissBatch: s.batch.dismissMessage,
  batchIsProcessing: s.batch.isProcessing,
  batchProgress: s.batch.progress,
  onBatchProcess: s.batch.requestStart,
  onBatchCancel: s.batch.cancel,
});
