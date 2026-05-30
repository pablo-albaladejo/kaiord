import type { WorkoutRecord } from "../../../types/calendar-record";
import type { Profile } from "../../../types/profile";
import type { WeekDay } from "./today-dates";
import { weekLoadFractions } from "./today-load";
import { WeekStripColumn } from "./WeekStripColumn";

export type WeekStripProps = {
  days: WeekDay[];
  workouts: WorkoutRecord[] | undefined;
  profile: Profile | null;
};

export function WeekStrip({ days, workouts, profile }: WeekStripProps) {
  const fractions = weekLoadFractions(
    days.map((d) => d.iso),
    workouts ?? [],
    profile
  );

  return (
    <div
      data-testid="today-week-strip"
      className="flex gap-1.5 rounded-lg bg-primary-900 border border-slate-800 p-3"
    >
      {days.map((day, index) => (
        <WeekStripColumn key={day.iso} day={day} fraction={fractions[index]} />
      ))}
    </div>
  );
}
