import { z } from "zod";

import { bodyCompositionSchema } from "./body-composition";
import { dailyWellnessSchema } from "./daily";
import { hrvSummarySchema } from "./hrv";
import { sleepRecordSchema } from "./sleep";
import { strainSummarySchema } from "./strain";
import { stressEpisodeSchema } from "./stress";
import { vitalsSummarySchema } from "./vitals";
import { weightMeasurementSchema } from "./weight";

/**
 * Tagged discriminated union of the health-metric payloads carried under
 * `extensions.health.<metric>` in KRD v2.0: the six bidirectional FIT-core
 * types plus the read-only wearable-session metrics `strain` and `vitals`.
 *
 * The `kind` discriminator selects the variant; sub-schemas validate
 * their own per-metric invariants.
 */
export const healthExtensionPayloadSchema = z.discriminatedUnion("kind", [
  sleepRecordSchema,
  weightMeasurementSchema,
  hrvSummarySchema,
  dailyWellnessSchema,
  bodyCompositionSchema,
  stressEpisodeSchema,
  strainSummarySchema,
  vitalsSummarySchema,
]);

export type HealthExtensionPayload = z.infer<
  typeof healthExtensionPayloadSchema
>;

export {
  type BodyComposition,
  bodyCompositionSchema,
} from "./body-composition";
export { type DailyWellness, dailyWellnessSchema } from "./daily";
export {
  type DayEnergyBalance,
  dayEnergyBalanceSchema,
  type ExpenditureSource,
  expenditureSourceSchema,
} from "./energy-balance";
export {
  type EnergyGoal,
  energyGoalSchema,
  type GoalType,
  goalTypeSchema,
} from "./energy-goal";
export { type HrvSummary, hrvSummarySchema } from "./hrv";
export {
  type MacroNutrients,
  macroNutrientsSchema,
  type MealSlot,
  mealSlotSchema,
} from "./nutrition";
export {
  type SleepRecord,
  sleepRecordSchema,
  type SleepStage,
  sleepStageSchema,
} from "./sleep";
export { type StrainSummary, strainSummarySchema } from "./strain";
export { type StressEpisode, stressEpisodeSchema } from "./stress";
export {
  BODY_FAT_TOLERANCE_PERCENT,
  DAILY_KCAL_TOLERANCE,
  DAILY_STEPS_TOLERANCE,
  HRV_TOLERANCE_MS,
  SLEEP_STAGE_TOLERANCE_SECONDS,
  SLEEP_TOTAL_DURATION_TOLERANCE_SECONDS,
  STRAIN_SCORE_TOLERANCE,
  STRESS_TOLERANCE,
  VITALS_RESPIRATORY_RATE_TOLERANCE,
  VITALS_RESTING_HEART_RATE_TOLERANCE,
  VITALS_SPO2_TOLERANCE,
  WEIGHT_TOLERANCE_KG,
} from "./tolerances";
export { type VitalsSummary, vitalsSummarySchema } from "./vitals";
export { type WeightMeasurement, weightMeasurementSchema } from "./weight";
