import { AthleteZonesProvider } from "../../../contexts/athlete-zones-context";
import { SetupChecklist } from "../../molecules/SetupChecklist/SetupChecklist";
import { CalendarDialogs } from "../CalendarDialogs";
import { DailyHeader } from "./DailyHeader";
import { EnergyBalanceCard } from "./EnergyBalanceCard";
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
    profile,
  } = useTodayData(focusDate, realTodayIso);
  const nav = useTodayFocusNav(focusIso, realTodayIso);
  const open = useDailyEntryOpen(coachingByDay, focusIso, realTodayIso);

  return (
    <AthleteZonesProvider profile={profile ?? null}>
      <div className="space-y-6 px-4 pb-8" data-testid="daily-page">
        <DailyHeader
          focusDate={focusDate}
          isFocusToday={isFocusToday}
          onBackToToday={nav.backToToday}
        />
        <SetupChecklist />
        <WeekStrip
          days={days}
          weekSummary={weekSummary}
          onSelectDay={nav.selectDay}
          onPrev={nav.goPrev}
          onNext={nav.goNext}
        />
        {/* The screen is named for a day; the day's session is what it is about,
          so it leads. Readiness and fuelling are context for it, not the other
          way round. */}
        <PlannedSession
          buckets={planned}
          onWorkoutClick={open.handleWorkoutClick}
          onActivityClick={open.handleActivityClick}
        />
        <ReadinessCard readiness={readiness} />
        <EnergyBalanceCard profileId={profile?.id ?? null} date={focusIso} />
        <TrendsCard />
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
    </AthleteZonesProvider>
  );
}
