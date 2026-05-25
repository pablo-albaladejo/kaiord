import { ROUTE_HEADING_ATTR } from "../../routing/constants";
import { AutoMatchBanner } from "../organisms/AutoMatchBanner/AutoMatchBanner";
import { CalendarBodyView } from "./CalendarBodyView";
import { CalendarDialogs } from "./CalendarDialogs";
import { CalendarHeader } from "./CalendarHeader";
import type { CalendarPageReadyState } from "./use-calendar-page";

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
}: CalendarPageReadyState) {
  const todayDate = new Date().toISOString().slice(0, 10);
  return (
    <div className="space-y-4" data-testid="calendar-page">
      <h1 tabIndex={-1} {...{ [ROUTE_HEADING_ATTR]: "" }} className="sr-only">
        Calendar
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
    </div>
  );
}
