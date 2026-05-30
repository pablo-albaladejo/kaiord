import { useMemo } from "react";

import { PlannedSession } from "./PlannedSession";
import { ReadinessCard } from "./ReadinessCard";
import { TodayHeader } from "./TodayHeader";
import { useTodayData } from "./use-today-data";
import { WeekStrip } from "./WeekStrip";

export default function Today() {
  const now = useMemo(() => new Date(), []);
  const { profile, days, weekWorkouts, todayWorkout, readiness } =
    useTodayData(now);

  return (
    <div className="space-y-6 px-4 pb-8" data-testid="today-page">
      <TodayHeader now={now} />
      <ReadinessCard readiness={readiness} />
      <WeekStrip days={days} workouts={weekWorkouts} profile={profile} />
      <PlannedSession workout={todayWorkout} profile={profile} />
    </div>
  );
}
