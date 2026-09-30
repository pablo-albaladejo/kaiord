/**
 * Top-of-page banners + batch cost confirmation + the navigation row. Kept
 * out of CalendarPage so each render function stays under the per-function
 * line cap.
 */

import {
  useCoachMoveNotice,
  useCoachMoveNoticeActions,
} from "../../contexts/coach-move-notice-context";
import { useActiveProfileLive } from "../../hooks/use-active-profile-live";
import type { useCoachingActivities } from "../../hooks/use-coaching-activities";
import type { CalendarView } from "../../types/user-preferences";
import { CoachMoveNotice } from "../molecules/CoachMoveNotice/CoachMoveNotice";
import { BatchCostConfirmation } from "../organisms/BatchCostConfirmation";
import { calendarEmptyBannerProps } from "./calendar-empty-banner-props";
import { CalendarEmptyBanners } from "./CalendarEmptyBanners";
import { CalendarNavRow } from "./CalendarNavRow";
import { SendWeekButton, SendWeekSection } from "./CalendarSendWeek";
import { useHasCoachingPlansLive } from "./use-calendar-live-queries";
import { useCalendarSendWeek } from "./use-calendar-send-week";
import type { useCalendarState } from "./use-calendar-state";
import { useLatestSessionDate } from "./use-latest-session-date";

export type CalendarHeaderProps = {
  state: ReturnType<typeof useCalendarState>;
  coaching: ReturnType<typeof useCoachingActivities>;
  view?: CalendarView;
  onViewChange?: (next: CalendarView) => void;
  /** The week's coaching plans no workout answers yet. */
  planCount?: number;
};

export function CalendarHeader({
  state: s,
  coaching,
  view,
  onViewChange,
  planCount,
}: CalendarHeaderProps) {
  const latestDate = useLatestSessionDate(s.latestWorkout?.date);
  const live = useActiveProfileLive();
  const profileId = live?.id ?? null;
  const hasAnyPlans = useHasCoachingPlansLive(profileId);
  const moves = useCoachMoveNotice(profileId, s.data.weekStart);
  const { dismiss: dismissMoves } = useCoachMoveNoticeActions();
  const send = useCalendarSendWeek(
    profileId,
    s.data.weekId,
    s.data.workoutsByDay
  );
  return (
    <>
      {moves && profileId && (
        <CoachMoveNotice
          moves={moves}
          onDismiss={() => dismissMoves(profileId, s.data.weekStart)}
        />
      )}
      <CalendarEmptyBanners
        {...calendarEmptyBannerProps(s, {
          latestDate,
          planCount,
          hasAnyPlans,
          sourceLinked: (live?.profile?.linkedAccounts.length ?? 0) > 0,
        })}
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
        actions={<SendWeekButton send={send} />}
      />
      <SendWeekSection send={send} weekId={s.data.weekId} />
    </>
  );
}
