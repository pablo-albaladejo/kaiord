import { CalendarDialogs } from "../CalendarDialogs";
import { DailyHeader } from "./DailyHeader";
import { PlannedSession } from "./PlannedSession";
import { ReadinessCard } from "./ReadinessCard";
import { TrendsCard } from "./TrendsCard";
import { useDailyEntryOpen } from "./use-daily-entry-open";
import { useTodayData } from "./use-today-data";
import { useTodayFocusNav } from "./use-today-focus-nav";
import { useTodayRouteParams } from "./use-today-route-params";
import { WeekStrip } from "./WeekStrip";

export default function Daily() {
  const { focusDate, focusIso, realTodayIso } = useTodayRouteParams();
  const {
    days,
    weekSummary,
    planned,
    readiness,
    isFocusToday,
    expandActivity,
    coachingByDay,
  } = useTodayData(focusDate, realTodayIso);
  const nav = useTodayFocusNav(focusIso, realTodayIso);
  const open = useDailyEntryOpen(coachingByDay, focusIso, realTodayIso);

  return (
    <div className="space-y-6 px-4 pb-8" data-testid="daily-page">
      <DailyHeader
        focusDate={focusDate}
        isFocusToday={isFocusToday}
        onBackToToday={nav.backToToday}
      />
      <ReadinessCard readiness={readiness} />
      <WeekStrip
        days={days}
        weekSummary={weekSummary}
        onSelectDay={nav.selectDay}
        onPrev={nav.goPrev}
        onNext={nav.goNext}
      />
      <TrendsCard />
      <PlannedSession
        buckets={planned}
        onWorkoutClick={open.handleWorkoutClick}
        onActivityClick={open.handleActivityClick}
      />
      <CalendarDialogs
        selectedWorkout={open.selectedWorkout}
        selectedCoachingActivity={open.selectedActivity}
        onCloseWorkout={open.closeWorkout}
        onCloseCoaching={open.closeActivity}
        expandActivity={expandActivity}
        onOpenExecuted={open.handleWorkoutClick}
        buildProcessHref={open.buildProcessHref}
      />
    </div>
  );
}
