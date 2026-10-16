/**
 * A manual daily row holds only the steps the athlete entered. A legacy
 * one — an imported row that a save before manual rows existed re-stamped
 * `manual` — still carries measured values: it is told apart by any
 * non-zero calorie, intensity or floors value, and keeps them.
 */
import type { HealthRecord } from "../../ports/health-record-repository";
import type { HealthDailyRecord } from "../../types/health/health-records";
import { MANUAL_SOURCE_BRIDGE_ID } from "../import/stamp-provenance";
import { buildStepsPayload } from "./manual-health-payload.mapper";

export const isLegacyManualRow = (row: HealthDailyRecord): boolean => {
  const { activeCalories, restingCalories, intensityMinutes, floorsClimbed } =
    row.krd;
  return (
    row.sourceBridgeId === MANUAL_SOURCE_BRIDGE_ID &&
    [
      activeCalories,
      restingCalories,
      intensityMinutes?.moderate,
      intensityMinutes?.vigorous,
      floorsClimbed,
    ].some((value) => (value ?? 0) !== 0)
  );
};

/** The manual steps payload; a legacy row keeps its measured values. */
export const buildManualStepsPayload = (
  steps: number,
  day: string,
  own: HealthRecord<unknown> | undefined
): HealthDailyRecord["krd"] => {
  const prior = own as HealthDailyRecord | undefined;
  return prior && isLegacyManualRow(prior)
    ? { ...prior.krd, steps }
    : buildStepsPayload(steps, day);
};
