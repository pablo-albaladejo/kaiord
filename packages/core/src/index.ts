/**
 * @kaiord/core - Public API
 * Bidirectional conversion between workout formats (FIT, TCX, ZWO, Garmin) and KRD
 */

// Domain: Schemas, Types, Converters, Validation, Errors
export type {
  BodyComposition,
  CadenceValue,
  DailyWellness,
  Duration,
  DurationType,
  Equipment,
  FileType,
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
  PaceValue,
  PowerValue,
  PowerZone,
  RepetitionBlock,
  SchemaValidator,
  SleepRecord,
  SleepStage,
  Sport,
  SportCategory,
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
  ValidationError,
  WeightMeasurement,
  Workout,
  WorkoutStep,
} from "./domain";
export {
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
  DEFAULT_TOLERANCES,
  durationSchema,
  durationTypeSchema,
  equipmentSchema,
  extractWorkout,
  fileTypeSchema,
  FIT_TO_SWIM_STROKE,
  FitParsingError,
  GarminParsingError,
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
  percentFtpToZone,
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
  UnsupportedKrdTypeError,
  validateKrd,
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
export type {
  AuthProvider,
  BinaryReader,
  BinaryWriter,
  ListOptions,
  Logger,
  LogLevel,
  PushResult,
  TextReader,
  TextWriter,
  TokenData,
  TokenStore,
  WorkoutService,
  WorkoutSummary,
} from "./ports";
export type { Analytics, AnalyticsEvent } from "./ports/analytics";

// Application: Conversion Functions
export { fromBinary, fromText } from "./application";
export { toBinary, toText } from "./application";

// Round-Trip Validation
export type { ValidateRoundTrip } from "./tests/round-trip/validate-round-trip";
export { validateRoundTrip } from "./tests/round-trip/validate-round-trip";

// Bridge Protocol — Profile Snapshot DTO + helpers
export type { ProfileSnapshot } from "./types/profile-snapshot";
export {
  fingerprintSnapshot,
  profileSnapshotSchema,
  STALE_SNAPSHOT_THRESHOLD_DAYS,
} from "./types/profile-snapshot";

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
export { deriveExternalId } from "./ingest/derive-external-id";
