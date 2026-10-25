import { type ReactNode, useMemo } from "react";

import { useWeekGarminDrift } from "../../hooks/use-week-garmin-drift";
import { GarminDriftProvider } from "../molecules/GarminDriftBadge/garmin-drift-context";
import { calendarDriftSubjects } from "./calendar-drift-subjects";

export type CalendarGarminDriftProps = {
  buckets: Parameters<typeof calendarDriftSubjects>[0];
  children: ReactNode;
};

/** Feeds the week's cards their Garmin date drift (design §3.11). */
export function CalendarGarminDrift({
  buckets,
  children,
}: CalendarGarminDriftProps) {
  const subjects = useMemo(() => calendarDriftSubjects(buckets), [buckets]);
  const drift = useWeekGarminDrift(subjects);
  return <GarminDriftProvider value={drift}>{children}</GarminDriftProvider>;
}
