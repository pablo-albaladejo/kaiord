/**
 * @kaiord/core - Public API
 * Bidirectional conversion between workout formats (FIT, TCX, ZWO, Garmin) and KRD
 */

// Domain: Schemas, Types, Converters, Validation, Errors
export type {
  Activity,
  ActivitySummary,
  BodyComposition,
  CadenceValue,
  DailyWellness,
  DayEnergyBalance,
  Duration,
  DurationType,
  EnergyGoal,
  Equipment,
  ExpenditureSource,
  FileType,
  GoalType,
  HealthExtensionPayload,
  HealthFileType,
  HeartRateValue,
  HrvSummary,
  Intensity,
  KRD,
  KRDEvent,
  KRDExtensions,
  KRDLap,
  KRDLapTrigger,
  KRDMetadata,
  KRDRecord,
  KRDSession,
  LengthUnit,
  MacroNutrients,
  MealSlot,
  PaceValue,
  PlannedSession,
  PlannedSessionStatus,
  PowerValue,
  PowerZone,
  RepetitionBlock,
  SchemaValidator,
  SleepRecord,
  SleepStage,
  Sport,
  SportCategory,
  StrainSummary,
  StressEpisode,
  StrokeTypeValue,
  SubSport,
  SwimStroke,
  Target,
  TargetType,
  TargetUnit,
  ToleranceChecker,
  ToleranceConfig,
  ToleranceViolation,
  TrainingZoneBand,
  TrainingZones,
  TrainingZoneSet,
  ValidationError,
  VitalsSummary,
  WeightMeasurement,
  Workout,
  WorkoutStep,
} from "./domain";
export {
  activitySchema,
  activitySummarySchema,
  BODY_FAT_TOLERANCE_PERCENT,
  bodyCompositionSchema,
  convertLengthToMeters,
  createFitParsingError,
  createGarminParsingError,
  createKrdValidationError,
  createSchemaValidator,
  createServiceApiError,
  createServiceAuthError,
  createTcxParsingError,
  createTcxValidationError,
  createToleranceChecker,
  createUnsupportedKrdTypeError,
  createWorkoutKRD,
  createZwiftParsingError,
  createZwiftValidationError,
  DAILY_KCAL_TOLERANCE,
  DAILY_STEPS_TOLERANCE,
  dailyWellnessSchema,
  dayEnergyBalanceSchema,
  DEFAULT_TOLERANCES,
  durationSchema,
  durationTypeSchema,
  energyGoalSchema,
  equipmentSchema,
  expenditureSourceSchema,
  extractWorkout,
  fileTypeSchema,
  FIT_TO_SWIM_STROKE,
  FitParsingError,
  GarminParsingError,
  goalTypeSchema,
  healthExtensionPayloadSchema,
  healthFileTypes,
  HRV_TOLERANCE_MS,
  hrvSummarySchema,
  intensitySchema,
  isHealthFileType,
  isPowerZone,
  isRepetitionBlock,
  krdEventSchema,
  krdExtensionsSchema,
  krdLapSchema,
  krdLapTriggerSchema,
  krdMetadataSchema,
  krdRecordSchema,
  krdSchema,
  krdSessionSchema,
  KrdValidationError,
  lengthUnitSchema,
  macroNutrientsSchema,
  mealSlotSchema,
  percentFtpToZone,
  plannedSessionSchema,
  plannedSessionStatusSchema,
  POWER_ZONE_PERCENT_FTP,
  POWER_ZONES,
  repetitionBlockSchema,
  ServiceApiError,
  ServiceAuthError,
  SLEEP_STAGE_TOLERANCE_SECONDS,
  SLEEP_TOTAL_DURATION_TOLERANCE_SECONDS,
  sleepRecordSchema,
  sleepStageSchema,
  sportCategory,
  sportSchema,
  STRAIN_SCORE_TOLERANCE,
  strainSummarySchema,
  STRESS_TOLERANCE,
  stressEpisodeSchema,
  subSportSchema,
  SWIM_STROKE_TO_FIT,
  swimStrokeSchema,
  targetSchema,
  targetTypeSchema,
  targetUnitSchema,
  TcxParsingError,
  TcxValidationError,
  toleranceConfigSchema,
  ToleranceExceededError,
  toleranceViolationSchema,
  trainingZoneBandSchema,
  trainingZoneSetSchema,
  trainingZonesSchema,
  UnsupportedKrdTypeError,
  validateKrd,
  VITALS_RESPIRATORY_RATE_TOLERANCE,
  VITALS_RESTING_HEART_RATE_TOLERANCE,
  VITALS_SPO2_TOLERANCE,
  vitalsSummarySchema,
  WEIGHT_TOLERANCE_KG,
  weightMeasurementSchema,
  workoutLikeFileTypes,
  workoutSchema,
  workoutStepSchema,
  zoneToPercentFtp,
  ZwiftParsingError,
  ZwiftValidationError,
} from "./domain";

// Ports
export { createNoopAnalytics } from "./adapters/analytics/noop-analytics";
export { createConsoleLogger } from "./adapters/logger/console-logger";
export type { Analytics, AnalyticsEvent } from "./ports/analytics";
export type { AuthProvider, TokenData } from "./ports/auth-provider";
export type {
  BinaryReader,
  BinaryWriter,
  TextReader,
  TextWriter,
} from "./ports/format-strategy";
export type { Logger, LogLevel } from "./ports/logger";
export type { TokenStore } from "./ports/token-store";
export type {
  ListOptions,
  PushResult,
  WorkoutService,
  WorkoutSummary,
} from "./ports/workout-service";

// Application: Conversion Functions
export { fromBinary, fromText } from "./application/from-format";
export { toBinary, toText } from "./application/to-format";

// Application: Energy calculators (pure)
export type { ActivityLevel } from "./application/energy/activity-factor";
export {
  DEFAULT_NEAT_FACTOR,
  NEAT_FACTOR,
  neatFactorForActivityLevel,
} from "./application/energy/activity-factor";
export type {
  AdaptiveTdeeResult,
  ComputeAdaptiveTdeeInput,
} from "./application/energy/adaptive-tdee";
export {
  computeAdaptiveTdee,
  KCAL_PER_KG_FAT,
  MIN_ADAPTIVE_DAYS,
} from "./application/energy/adaptive-tdee";
export type { EnergyBalanceRollup } from "./application/energy/aggregate-energy-balance";
export { aggregateEnergyBalance } from "./application/energy/aggregate-energy-balance";
export type {
  BmrFormula,
  BmrInput,
  BmrResult,
  Sex,
} from "./application/energy/bmr";
export { computeBmr } from "./application/energy/bmr";
export type {
  AssembleDayEnergyBalanceInput,
  ResolvedExpenditure,
} from "./application/energy/day-balance";
export { assembleDayEnergyBalance } from "./application/energy/day-balance";
export type { EmaOptions, EmaPoint, EmaResult } from "./application/energy/ema";
export { exponentialMovingAverage } from "./application/energy/ema";
export type { ExpectedActivityKcalInput } from "./application/energy/expected-activity-kcal";
export { estimateExpectedActivityKcal } from "./application/energy/expected-activity-kcal";
export type {
  DayExpenditureInput,
  DayExpenditureResult,
  MeasuredWellness,
} from "./application/energy/expenditure";
export { resolveDayExpenditure } from "./application/energy/expenditure";
export type {
  ComputeDailyDeltaInput,
  ComputeDailyDeltaResult,
} from "./application/energy/goal-delta";
export {
  computeDailyDelta,
  FLOOR_KCAL,
  MUSCLE_SURPLUS_CAP,
} from "./application/energy/goal-delta";
export type { ComputeMacroTargetsInput } from "./application/energy/macro-targets";
export { computeMacroTargets } from "./application/energy/macro-targets";
export {
  DEFAULT_MET,
  MET_TABLE,
  metForSport,
} from "./application/energy/met-table";
export type { ComputePeriodizedTargetInput } from "./application/energy/periodized-target";
export { computePeriodizedTarget } from "./application/energy/periodized-target";

// Round-Trip Validation
export type { ValidateRoundTrip } from "./application/round-trip/validate-round-trip";
export { validateRoundTrip } from "./application/round-trip/validate-round-trip";

// Bridge Protocol — Profile Snapshot DTO + helpers
export type { ProfileSnapshot } from "./protocol/profile-snapshot";
export {
  fingerprintSnapshot,
  profileSnapshotSchema,
  STALE_SNAPSHOT_THRESHOLD_DAYS,
} from "./protocol/profile-snapshot";

// Managed Data Registry
export type {
  BridgeId,
  HashProjection,
  ManagedDataRegistryEntry,
  ManagedDataType,
} from "./domain";
export {
  canonicalHash,
  MANAGED_DATA_REGISTRY,
  managedDataTypes,
} from "./domain";

// Ingest utilities
export { deriveExternalId } from "./domain";

// Lab analytics domain (LabReport, LabValue, parameter catalog, conversion, flag)
export * from "./domain/lab";
