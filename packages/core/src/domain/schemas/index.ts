// KRD Schema and Types
export type {
  KRD,
  KRDEvent,
  KRDExtensions,
  KRDLap,
  KRDLapTrigger,
  KRDMetadata,
  KRDRecord,
  KRDSession,
} from "./krd";
export {
  krdEventSchema,
  krdExtensionsSchema,
  krdLapSchema,
  krdLapTriggerSchema,
  krdMetadataSchema,
  krdRecordSchema,
  krdSchema,
  krdSessionSchema,
} from "./krd";

// Workout Schema and Types
export type { RepetitionBlock, Workout, WorkoutStep } from "./workout";
export {
  repetitionBlockSchema,
  workoutSchema,
  workoutStepSchema,
} from "./workout";

// Planned Session Schema and Types (replaces the former `training-plan`)
export type { PlannedSession, PlannedSessionStatus } from "./planned-session";
export {
  plannedSessionSchema,
  plannedSessionStatusSchema,
} from "./planned-session";

// Activity Schema and Types (executed session: summary + optional KRD)
export type { Activity, ActivitySummary } from "./activity";
export { activitySchema, activitySummarySchema } from "./activity";

// Training Zones Schema and Types
export type {
  TrainingZoneBand,
  TrainingZones,
  TrainingZoneSet,
} from "./training-zones";
export {
  trainingZoneBandSchema,
  trainingZoneSetSchema,
  trainingZonesSchema,
} from "./training-zones";

// Duration Schema and Types
export type { Duration, DurationType } from "./duration";
export { durationSchema, durationTypeSchema } from "./duration";

// Target Schema and Types
export type {
  CadenceValue,
  HeartRateValue,
  PaceValue,
  PowerValue,
  StrokeTypeValue,
  Target,
  TargetType,
  TargetUnit,
} from "./target";
export { targetSchema, targetTypeSchema, targetUnitSchema } from "./target";

// Enumeration Schemas and Types
export type { Equipment } from "./equipment";
export { equipmentSchema } from "./equipment";
export type { Intensity } from "./intensity";
export { intensitySchema } from "./intensity";
export type { Sport } from "./sport";
export { sportSchema } from "./sport";
export type { SportCategory } from "./sport-category";
export { sportCategory } from "./sport-category";
export type { SubSport } from "./sub-sport";
export { subSportSchema } from "./sub-sport";
export type { SwimStroke } from "./swim-stroke";
export {
  FIT_TO_SWIM_STROKE,
  SWIM_STROKE_TO_FIT,
  swimStrokeSchema,
} from "./swim-stroke";

// File Type Schema and Types
export type { FileType, HealthFileType } from "./file-type";
export {
  fileTypeSchema,
  healthFileTypes,
  isHealthFileType,
  workoutLikeFileTypes,
} from "./file-type";

// Health Data Schemas and Types (KRD v2.0)
export type {
  BodyComposition,
  DailyWellness,
  DayEnergyBalance,
  EnergyGoal,
  ExpenditureSource,
  GoalType,
  HealthExtensionPayload,
  HrvSummary,
  MacroNutrients,
  MealSlot,
  SleepRecord,
  SleepStage,
  StressEpisode,
  WeightMeasurement,
} from "./health";
export {
  BODY_FAT_TOLERANCE_PERCENT,
  bodyCompositionSchema,
  DAILY_KCAL_TOLERANCE,
  DAILY_STEPS_TOLERANCE,
  dailyWellnessSchema,
  dayEnergyBalanceSchema,
  energyGoalSchema,
  expenditureSourceSchema,
  goalTypeSchema,
  healthExtensionPayloadSchema,
  HRV_TOLERANCE_MS,
  hrvSummarySchema,
  macroNutrientsSchema,
  mealSlotSchema,
  SLEEP_STAGE_TOLERANCE_SECONDS,
  SLEEP_TOTAL_DURATION_TOLERANCE_SECONDS,
  sleepRecordSchema,
  sleepStageSchema,
  STRESS_TOLERANCE,
  stressEpisodeSchema,
  WEIGHT_TOLERANCE_KG,
  weightMeasurementSchema,
} from "./health";

// Length Unit Schema and Types
export type { LengthUnit } from "./length-unit";
export { lengthUnitSchema } from "./length-unit";
