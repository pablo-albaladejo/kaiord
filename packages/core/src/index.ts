/**
 * @kaiord/core - Public API
 * Bidirectional conversion between workout formats (FIT, TCX, ZWO, Garmin) and KRD
 */

// Domain: Schemas, Types, Converters, Validation, Errors
export {
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
  createWorkoutKRD,
  createZwiftParsingError,
  createZwiftValidationError,
  DEFAULT_TOLERANCES,
  durationSchema,
  durationTypeSchema,
  equipmentSchema,
  extractWorkout,
  fileTypeSchema,
  FIT_TO_SWIM_STROKE,
  FitParsingError,
  GarminParsingError,
  intensitySchema,
  isRepetitionBlock,
  krdEventSchema,
  krdLapSchema,
  krdLapTriggerSchema,
  krdMetadataSchema,
  krdRecordSchema,
  krdSchema,
  krdSessionSchema,
  KrdValidationError,
  lengthUnitSchema,
  repetitionBlockSchema,
  ServiceApiError,
  ServiceAuthError,
  sportSchema,
  subSportSchema,
  SWIM_STROKE_TO_FIT,
  swimStrokeSchema,
  targetSchema,
  targetTypeSchema,
  targetUnitSchema,
  TcxParsingError,
  TcxValidationError,
  toleranceConfigSchema,
  toleranceViolationSchema,
  ToleranceExceededError,
  validateKrd,
  workoutSchema,
  workoutStepSchema,
  ZwiftParsingError,
  ZwiftValidationError,
} from "./domain";

export type {
  CadenceValue,
  Duration,
  DurationType,
  Equipment,
  FileType,
  HeartRateValue,
  Intensity,
  KRD,
  KRDEvent,
  KRDLap,
  KRDLapTrigger,
  KRDMetadata,
  KRDRecord,
  KRDSession,
  LengthUnit,
  PaceValue,
  PowerValue,
  RepetitionBlock,
  SchemaValidator,
  Sport,
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
  Workout,
  WorkoutStep,
} from "./domain";

// Ports
export type {
  AuthProvider,
  BinaryReader,
  BinaryWriter,
  ListOptions,
  LogLevel,
  Logger,
  PushResult,
  TextReader,
  TextWriter,
  TokenData,
  TokenStore,
  WorkoutService,
  WorkoutSummary,
} from "./ports";
export { createConsoleLogger } from "./adapters/logger/console-logger";

// Application: Conversion Functions
export { fromBinary, fromText } from "./application";
export { toBinary, toText } from "./application";

// Round-Trip Validation
export { validateRoundTrip } from "./tests/round-trip/validate-round-trip";
export type { ValidateRoundTrip } from "./tests/round-trip/validate-round-trip";
