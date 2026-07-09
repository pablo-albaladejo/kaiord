/**
 * Resolves the inclusive `{ start, end }` ISO range for the Nutrition trends
 * view from an anchor date and a window length in days. `end` is the anchor
 * (today); `start` is `windowDays - 1` days earlier, so a 30-day window spans
 * 30 inclusive calendar days ending today.
 */

import type { HealthDateRange } from "../../../../hooks/health/health-live-query";
import { addDaysIso } from "../../Daily/today-dates";

export type EnergyTrendRangeDays = 30 | 90 | 365;

export const ENERGY_TREND_RANGES: ReadonlyArray<{
  days: EnergyTrendRangeDays;
}> = [{ days: 30 }, { days: 90 }, { days: 365 }];

export const resolveTrendRange = (
  anchor: string,
  windowDays: EnergyTrendRangeDays
): HealthDateRange => ({
  start: addDaysIso(anchor, -(windowDays - 1)),
  end: anchor,
});
