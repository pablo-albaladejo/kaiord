/**
 * The local trace of an athlete move (design §3.13, AC-17). The visible text
 * shortens in compact density; the accessible name always carries the full
 * sentence. A card that is itself a button cannot expose an inner name, so
 * it appends `useMovedFromLabel` to its own.
 */
import { useTranslation } from "react-i18next";

import { isAthleteMoved } from "../../../application/session-movability";
import { useActiveLocale } from "../../../i18n/LocaleProvider";
import type { WorkoutRecord } from "../../../types/calendar-record";
import { shortWeekdayName, weekdayDate } from "../../pages/calendar-day-labels";

type MovedWorkout = Pick<WorkoutRecord, "date" | "coachDate">;

export type MovedFromChipProps = { workout: MovedWorkout; compact?: boolean };

const dayNumber = (date: string) => String(Number(date.slice(8)));

const coachDayOf = (w: MovedWorkout) =>
  isAthleteMoved(w) ? w.coachDate : undefined;

export const useMovedFromLabel = (workout: MovedWorkout) => {
  const { t } = useTranslation("calendar");
  const locale = useActiveLocale();
  const coachDate = coachDayOf(workout);
  if (!coachDate) return undefined;
  return t("movedFrom.aria", { date: weekdayDate(coachDate, locale) });
};

export function MovedFromChip({ workout, compact }: MovedFromChipProps) {
  const { t } = useTranslation("calendar");
  const locale = useActiveLocale();
  const label = useMovedFromLabel(workout);
  const coachDate = coachDayOf(workout);
  if (!coachDate || !label) return null;
  const day = `${shortWeekdayName(coachDate, locale)} ${dayNumber(coachDate)}`;
  return (
    <span
      role="img"
      data-testid="moved-from-chip"
      aria-label={label}
      className="shrink-0 rounded-full border border-edge-soft px-2 py-px text-[11px] font-medium text-ink-muted tabular-nums"
    >
      {compact ? day : t("movedFrom.label", { day })}
    </span>
  );
}
