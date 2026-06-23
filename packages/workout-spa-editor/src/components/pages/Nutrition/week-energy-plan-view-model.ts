/**
 * Pure view-model for a weekly energy-plan row: the short weekday label and the
 * display strings for expenditure / target (a dash when the day is gated, so
 * the UI never renders a fabricated number).
 */

import type { WeekEnergyPlanRow } from "../../../application/energy/week-energy-plan-row";
import { isoToLocalDate } from "../Daily/today-dates";

const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"] as const;
const EM_DASH = "—";

export type WeekEnergyPlanRowView = {
  date: string;
  dayLabel: string;
  expenditureText: string;
  targetText: string;
  hasWorkout: boolean;
  isMeasured: boolean;
};

const kcalText = (value: number | null): string =>
  value === null ? EM_DASH : `${Math.round(value)} kcal`;

export const toWeekEnergyPlanRowView = (
  row: WeekEnergyPlanRow
): WeekEnergyPlanRowView => ({
  date: row.date,
  dayLabel: WEEKDAY_LETTERS[isoToLocalDate(row.date).getDay()] ?? "",
  expenditureText: kcalText(row.expenditureKcal),
  targetText: kcalText(row.targetKcal),
  hasWorkout: row.hasWorkout,
  isMeasured: row.source === "measured",
});
