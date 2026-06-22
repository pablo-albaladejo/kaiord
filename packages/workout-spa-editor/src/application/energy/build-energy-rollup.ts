/**
 * `buildEnergyRollup` — rolls a date range up into the core
 * `EnergyBalanceRollup` totals/averages by composing `buildDayEnergyBalance`
 * per day and aggregating the resolvable days.
 *
 * Each day reuses `buildDayEnergyBalance` (single-sourcing the measured-vs-
 * predicted expenditure, BMR gating, and untracked-intake handling), and only
 * days whose balance is resolvable feed the roll-up — a gated day contributes
 * nothing rather than a misleading basal estimate. `daysResolved` reports how
 * many of the `daysInRange` resolved, so the UI can label a partial window.
 */

import type { DayEnergyBalance } from "@kaiord/core";
import { aggregateEnergyBalance, type EnergyBalanceRollup } from "@kaiord/core";

import type { PersistencePort } from "../../ports/persistence-port";
import { buildDayEnergyBalance } from "./build-day-energy-balance";
import { rangeDatesInclusive } from "./range-dates";

export type EnergyRollup = EnergyBalanceRollup & {
  startDate: string;
  endDate: string;
  /** Inclusive calendar days spanned by the range. */
  daysInRange: number;
  /** Days whose balance resolved (== rollup.dayCount). */
  daysResolved: number;
};

export type BuildEnergyRollupInput = {
  persistence: PersistencePort;
  profileId: string;
  /** Inclusive ISO start (YYYY-MM-DD). */
  startDate: string;
  /** Inclusive ISO end (YYYY-MM-DD). */
  endDate: string;
};

const resolveDays = async (
  input: BuildEnergyRollupInput,
  dates: string[]
): Promise<DayEnergyBalance[]> => {
  const results = await Promise.all(
    dates.map((date) =>
      buildDayEnergyBalance({
        persistence: input.persistence,
        profileId: input.profileId,
        date,
        // The roll-up feeds the adaptive estimate; computing it per day here
        // would recurse. Totals never depend on the target, so suppress it.
        includeAdaptive: false,
      })
    )
  );
  return results.flatMap((result) => (result.gated ? [] : [result.balance]));
};

export const buildEnergyRollup = async (
  input: BuildEnergyRollupInput
): Promise<EnergyRollup> => {
  const dates = rangeDatesInclusive(input.startDate, input.endDate);
  const days = await resolveDays(input, dates);
  const rollup = aggregateEnergyBalance(days);
  return {
    ...rollup,
    startDate: input.startDate,
    endDate: input.endDate,
    daysInRange: dates.length,
    daysResolved: rollup.dayCount,
  };
};
