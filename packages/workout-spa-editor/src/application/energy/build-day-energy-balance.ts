/**
 * `buildDayEnergyBalance` — composes the per-day energy-balance view-model for
 * one (profile, date) from already-ingested data.
 *
 * Expenditure is measured (`restingCalories + activeCalories`) when device
 * wellness covers the day, else predicted from BMR + expected activity, where
 * the expected activity is estimated from the day's planned workout(s). Intake
 * is the sum of logged entries, or `null` (untracked) when none; `macro_actuals`
 * rolls the same entries up into a protein/carb/fat breakdown (omitted when
 * untracked).
 *
 * When an active goal exists AND the profile is BMR-resolvable, the day target
 * (`target_kcal` + `macro_targets`) is derived from the core goal calculators
 * and the `goal` context (signed delta + safety cap) is exposed. Without a goal
 * or BMR inputs the target stays `null` and `goal` is `null` (Phase 1 shape).
 *
 * When a goal is active the adaptive maintenance estimate (logged intake vs the
 * smoothed weight trend) is computed and, once it has sufficient history,
 * replaces the modeled BMR maintenance feeding the target so it self-corrects.
 */

import { assembleDayEnergyBalance, resolveDayExpenditure } from "@kaiord/core";

import type { PersistencePort } from "../../ports/persistence-port";
import { computeAdaptiveMaintenance } from "./compute-adaptive-maintenance";
import type { DayEnergyBalanceResult } from "./day-energy-balance-result";
import { loadDayEnergySources } from "./load-day-energy-sources";
import {
  isGated,
  sumIntakeKcal,
  toExpenditureInput,
} from "./resolve-day-expenditure-inputs";
import { resolveDayGoalTarget, toGoalContext } from "./resolve-day-goal-target";
import { resolveDayActivityKcal } from "./resolve-day-weight";
import { sumMacroActuals } from "./sum-macro-actuals";

export type BuildDayEnergyBalanceInput = {
  persistence: PersistencePort;
  profileId: string;
  /** ISO date (YYYY-MM-DD) the balance covers. */
  date: string;
  /** Horizon start for the goal delta; defaults to `date`. */
  today?: string;
  /**
   * Whether to compute the adaptive maintenance estimate (default true). The
   * roll-up reader sets this false: the adaptive estimate itself rolls up the
   * window, so re-deriving it per day inside that roll-up would recurse, and
   * intake/expenditure/net totals never depend on the target anyway.
   */
  includeAdaptive?: boolean;
};

export const buildDayEnergyBalance = async ({
  persistence,
  profileId,
  date,
  today,
  includeAdaptive = true,
}: BuildDayEnergyBalanceInput): Promise<DayEnergyBalanceResult> => {
  const sources = await loadDayEnergySources(persistence, profileId, date);
  if (isGated(sources)) {
    return { gated: true, reason: "profile-incomplete" };
  }
  const expectedActivityKcal = await resolveDayActivityKcal(
    persistence,
    profileId,
    date,
    sources
  );
  const expenditure = resolveDayExpenditure(
    toExpenditureInput(sources, date, expectedActivityKcal)
  );
  const adaptive =
    includeAdaptive && sources.target
      ? await computeAdaptiveMaintenance({
          persistence,
          profileId,
          asOfDate: date,
        })
      : null;
  const derivation = resolveDayGoalTarget(
    sources,
    today ?? date,
    expectedActivityKcal,
    adaptive
  );
  const balance = assembleDayEnergyBalance({
    date,
    expenditure,
    intakeKcal: sumIntakeKcal(sources.intakeEntries),
    targetKcal: derivation?.targetKcal ?? null,
    macroTargets: derivation?.macroTargets,
    macroActuals: sumMacroActuals(sources.intakeEntries),
  });
  return { gated: false, balance, goal: toGoalContext(derivation) };
};
