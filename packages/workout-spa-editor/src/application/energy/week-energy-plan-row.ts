/**
 * Row shape for the weekly energy-plan view: one resolved day's predicted
 * expenditure + target, whether a workout is scheduled, and its `source` label
 * so the UI can mark measured vs predicted days honestly.
 *
 * `expenditureKcal` / `targetKcal` are `null` for a gated day (profile lacks the
 * BMR inputs and the day has no measured wellness) — the UI shows a dash, never
 * a fabricated number.
 */

import type { ExpenditureSource } from "@kaiord/core";

export type WeekEnergyPlanRow = {
  /** ISO date (YYYY-MM-DD) the row covers. */
  date: string;
  expenditureKcal: number | null;
  targetKcal: number | null;
  hasWorkout: boolean;
  source: ExpenditureSource | null;
};
