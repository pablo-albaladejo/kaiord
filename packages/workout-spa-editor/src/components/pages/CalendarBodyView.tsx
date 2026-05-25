import type { CoachingActivity } from "../../types/coaching-activity";
import { CalendarWeekGrid } from "./CalendarWeekGrid";
import { CalendarWeekList } from "./CalendarWeekList";
import type { CalendarPageReadyState } from "./use-calendar-page";

export type CalendarBodyViewProps = {
  s: CalendarPageReadyState["s"];
  buckets: CalendarPageReadyState["buckets"];
  view: CalendarPageReadyState["view"];
  todayDate: string;
  setSelectedActivity: (a: CoachingActivity | null) => void;
  wellnessByDay: CalendarPageReadyState["wellnessByDay"];
};

export function CalendarBodyView({
  s,
  buckets,
  view,
  todayDate,
  setSelectedActivity,
  wellnessByDay,
}: CalendarBodyViewProps) {
  if (view === "list") {
    return (
      <CalendarWeekList
        days={s.data.days}
        matchedByDay={buckets.matchedByDay}
        soloPlansByDay={buckets.soloPlansByDay}
        soloActualsByDay={buckets.soloActualsByDay}
        todayDate={todayDate}
        onWorkoutClick={s.handleWorkoutClick}
        onEmptyDayClick={s.handleEmptyDayClick}
        onActivityClick={setSelectedActivity}
        wellnessByDay={wellnessByDay}
      />
    );
  }
  return (
    <CalendarWeekGrid
      days={s.data.days}
      matchedByDay={buckets.matchedByDay}
      soloPlansByDay={buckets.soloPlansByDay}
      soloActualsByDay={buckets.soloActualsByDay}
      todayDate={todayDate}
      view={view}
      onWorkoutClick={s.handleWorkoutClick}
      onEmptyDayClick={s.handleEmptyDayClick}
      onActivityClick={setSelectedActivity}
      wellnessByDay={wellnessByDay}
    />
  );
}
