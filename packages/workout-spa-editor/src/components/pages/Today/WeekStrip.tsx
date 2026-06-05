import type { WorkoutRecord } from "../../../types/calendar-record";
import type { Profile } from "../../../types/profile";
import { getWeekIdForDate } from "../../../utils/week-utils";
import type { WeekDay } from "./today-dates";
import { weekLoadFractions } from "./today-load";
import { WeekStripColumn } from "./WeekStripColumn";

export type WeekStripProps = {
  days: WeekDay[];
  workouts: WorkoutRecord[] | undefined;
  profile: Profile | null;
};

function weekHref(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return `/calendar/${getWeekIdForDate(new Date(year, month - 1, day))}`;
}

export function WeekStrip({ days, workouts, profile }: WeekStripProps) {
  const fractions = weekLoadFractions(
    days.map((d) => d.iso),
    workouts ?? [],
    profile
  );
  const href = days.length > 0 ? weekHref(days[0].iso) : "/calendar";

  return (
    <div
      data-testid="today-week-strip"
      className="flex gap-1.5 rounded-lg bg-primary-900 border border-slate-800 p-3"
    >
      {days.map((day, index) => (
        <WeekStripColumn
          key={day.iso}
          day={day}
          fraction={fractions[index]}
          href={href}
        />
      ))}
    </div>
  );
}
