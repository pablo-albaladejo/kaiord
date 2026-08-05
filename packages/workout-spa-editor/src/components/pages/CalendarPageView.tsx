import { AthleteZonesProvider } from "../../contexts/athlete-zones-context";
import { useTranslate } from "../../i18n/use-translate";
import { ROUTE_HEADING_ATTR } from "../../routing/constants";
import { todayIsoDate } from "../../utils/today-iso-date";
import { WeekStatusBar } from "../molecules/WeekStatusBar/WeekStatusBar";
import { AutoMatchBanner } from "../organisms/AutoMatchBanner/AutoMatchBanner";
import { CalendarAddEntryDialogs } from "./CalendarAddEntryDialogs";
import { CalendarBodyView } from "./CalendarBodyView";
import { CalendarDialogs } from "./CalendarDialogs";
import { CalendarHeader } from "./CalendarHeader";
import type { CalendarPageReadyState } from "./use-calendar-page";
import { buildWeekStatus } from "./week-status";

export function CalendarPageView({
  s,
  coaching,
  buckets,
  view,
  onViewChange,
  selectedActivity,
  setSelectedActivity,
  suggestions,
  bannerActions,
  wellnessByDay,
  profile,
}: CalendarPageReadyState) {
  const t = useTranslate("calendar");
  const todayDate = todayIsoDate();
  return (
    <AthleteZonesProvider profile={profile}>
      <div className="space-y-4" data-testid="calendar-page">
        <h1 tabIndex={-1} {...{ [ROUTE_HEADING_ATTR]: "" }} className="sr-only">
          {t("page.heading")}
        </h1>
        <CalendarHeader
          state={s}
          coaching={coaching}
          view={view}
          onViewChange={onViewChange}
        />
        {suggestions.length > 0 && (
          <AutoMatchBanner
            suggestions={suggestions}
            onAccept={bannerActions.onAccept}
            onReject={bannerActions.onReject}
          />
        )}
        <WeekStatusBar status={buildWeekStatus(buckets, s.data.rawCount)} />
        <CalendarBodyView
          s={s}
          buckets={buckets}
          view={view}
          todayDate={todayDate}
          setSelectedActivity={setSelectedActivity}
          wellnessByDay={wellnessByDay}
        />
        <CalendarDialogs
          selectedWorkout={s.selectedWorkout}
          selectedCoachingActivity={selectedActivity}
          onCloseWorkout={() => s.setSelectedWorkout(null)}
          onCloseCoaching={() => setSelectedActivity(null)}
          expandActivity={coaching.expandActivity}
          onOpenExecuted={s.handleWorkoutClick}
        />
        <CalendarAddEntryDialogs s={s} />
      </div>
    </AthleteZonesProvider>
  );
}
