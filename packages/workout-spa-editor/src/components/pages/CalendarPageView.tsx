/**
 * Pure render component for `CalendarPage`. Receives the resolved
 * `ready` state from `useCalendarPage` and emits the JSX tree —
 * no data fetching, no side effects, no early-return branching.
 */

import { ROUTE_HEADING_ATTR } from "../../routing/constants";
import { AutoMatchBanner } from "../organisms/AutoMatchBanner/AutoMatchBanner";
import { CalendarDialogs } from "./CalendarDialogs";
import { CalendarHeader } from "./CalendarHeader";
import { CalendarWeekGrid } from "./CalendarWeekGrid";
import type { CalendarPageReadyState } from "./use-calendar-page";

export function CalendarPageView({
  s,
  coaching,
  buckets,
  density,
  onDensityChange,
  selectedActivity,
  setSelectedActivity,
  suggestions,
  bannerActions,
}: CalendarPageReadyState) {
  return (
    <div className="space-y-4" data-testid="calendar-page">
      <h1 tabIndex={-1} {...{ [ROUTE_HEADING_ATTR]: "" }} className="sr-only">
        Calendar
      </h1>
      <CalendarHeader
        state={s}
        coaching={coaching}
        density={density}
        onDensityChange={onDensityChange}
      />
      {suggestions.length > 0 && (
        <AutoMatchBanner
          suggestions={suggestions}
          onAccept={bannerActions.onAccept}
          onReject={bannerActions.onReject}
        />
      )}
      <CalendarWeekGrid
        days={s.data.days}
        matchedByDay={buckets.matchedByDay}
        soloPlansByDay={buckets.soloPlansByDay}
        soloActualsByDay={buckets.soloActualsByDay}
        todayDate={new Date().toISOString().slice(0, 10)}
        density={density}
        onWorkoutClick={s.handleWorkoutClick}
        onEmptyDayClick={s.setEmptyDayDate}
        onActivityClick={setSelectedActivity}
      />
      <CalendarDialogs
        selectedWorkout={s.selectedWorkout}
        emptyDayDate={s.emptyDayDate}
        selectedCoachingActivity={selectedActivity}
        onCloseWorkout={() => s.setSelectedWorkout(null)}
        onCloseDay={() => s.setEmptyDayDate(null)}
        onCloseCoaching={() => setSelectedActivity(null)}
        expandActivity={coaching.expandActivity}
      />
    </div>
  );
}
