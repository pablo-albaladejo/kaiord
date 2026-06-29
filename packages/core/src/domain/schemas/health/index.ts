import { z } from "zod";

import { bodyCompositionSchema } from "./body-composition";
import { dailyWellnessSchema } from "./daily";
import { hrvSummarySchema } from "./hrv";
import { sleepRecordSchema } from "./sleep";
import { stressEpisodeSchema } from "./stress";
import { weightMeasurementSchema } from "./weight";

/**
 * Tagged discriminated union of the six health-metric payloads carried
 * under `extensions.health.<metric>` in KRD v2.0.
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
export { type StressEpisode, stressEpisodeSchema } from "./stress";
export {
  BODY_FAT_TOLERANCE_PERCENT,
  DAILY_KCAL_TOLERANCE,
  DAILY_STEPS_TOLERANCE,
  HRV_TOLERANCE_MS,
  SLEEP_STAGE_TOLERANCE_SECONDS,
  SLEEP_TOTAL_DURATION_TOLERANCE_SECONDS,
  STRESS_TOLERANCE,
  WEIGHT_TOLERANCE_KG,
} from "./tolerances";
export { type WeightMeasurement, weightMeasurementSchema } from "./weight";
