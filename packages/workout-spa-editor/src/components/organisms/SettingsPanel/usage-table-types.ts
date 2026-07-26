/**
 * Shared view types for the Usage tab. A `MonthUsage` is the folded projection
 * of one month's `usageEvents`: the month total plus a per-purpose sub-total map
 * (chat / workout_generation / lab_extraction). Kept in its own module so the
 * table shell, the per-month row, and the tab that builds them can share the
 * types without an import cycle.
 */
import type { UsageTotals } from "../../../application/usage/fold-usage-events";

export const USAGE_PURPOSES = [
  "chat",
  "workout_generation",
  "lab_extraction",
] as const;

export type UsagePurpose = (typeof USAGE_PURPOSES)[number];

export type MonthUsage = {
  yearMonth: string;
  totals: UsageTotals;
  byPurpose: Record<UsagePurpose, UsageTotals>;
};
