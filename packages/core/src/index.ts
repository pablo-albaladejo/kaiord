/**
 * @kaiord/core - Public API
 * Bidirectional conversion between workout formats (FIT, TCX, ZWO, Garmin) and KRD
 */

// ============================================
// Domain Schemas
// ============================================

// KRD Schema and Types
export {
  krdEventSchema,
  krdLapSchema,
  krdMetadataSchema,
  krdRecordSchema,
  krdSchema,
  krdSessionSchema,
} from "./domain/schemas/krd";
export type {
  KRD,
  KRDEvent,
  KRDLap,
  KRDMetadata,
  KRDRecord,
  KRDSession,
} from "./domain/schemas/krd";

// Workout Schema and Types
export {
  repetitionBlockSchema,
  workoutSchema,
  workoutStepSchema,
} from "./domain/schemas/workout";
export type {
  RepetitionBlock,
  Workout,
  WorkoutStep,
} from "./domain/schemas/workout";

// Duration Schema and Types
export { durationSchema, durationTypeSchema } from "./domain/schemas/duration";
export type { Duration, DurationType } from "./domain/schemas/duration";

// Target Schema and Types
export {
  targetSchema,
  targetTypeSchema,
  targetUnitSchema,
} from "./domain/schemas/target";
export type {
  CadenceValue,
  HeartRateValue,
  PaceValue,
  PowerValue,
  StrokeTypeValue,
  Target,
  TargetType,
  TargetUnit,
} from "./domain/schemas/target";

// Enumeration Schemas and Types
export { sportSchema } from "./domain/schemas/sport";
export type { Sport } from "./domain/schemas/sport";

export { subSportSchema } from "./domain/schemas/sub-sport";
export type { SubSport } from "./domain/schemas/sub-sport";

export { intensitySchema } from "./domain/schemas/intensity";
export type { Intensity } from "./domain/schemas/intensity";

export { equipmentSchema } from "./domain/schemas/equipment";
export type { Equipment } from "./domain/schemas/equipment";

export {
  FIT_TO_SWIM_STROKE,
  SWIM_STROKE_TO_FIT,
  swimStrokeSchema,
} from "./domain/schemas/swim-stroke";
export type { SwimStroke } from "./domain/schemas/swim-stroke";

// File Type Schema and Types
export { fileTypeSchema } from "./domain/schemas/file-type";
export type { FileType } from "./domain/schemas/file-type";

// Length Unit Schema and Types
export { lengthUnitSchema } from "./domain/schemas/length-unit";
export type { LengthUnit } from "./domain/schemas/length-unit";

// KRD Lap Trigger Schema and Types
export { krdLapTriggerSchema } from "./domain/schemas/krd/lap";
export type { KRDLapTrigger } from "./domain/schemas/krd/lap";

// Domain Type Guards
export { isRepetitionBlock } from "./domain/type-guards";

// Domain Converters
export { convertLengthToMeters } from "./domain/converters/length-unit.converter";
export { createWorkoutKRD } from "./domain/converters/workout-to-krd.converter";

// ============================================
// Error Types and Factories
// ============================================

export {
  FitParsingError,
  GarminParsingError,
  KrdValidationError,
  ServiceApiError,
  ServiceAuthError,
  TcxParsingError,
  TcxValidationError,
  ToleranceExceededError,
  ZwiftParsingError,
  ZwiftValidationError,
  createFitParsingError,
  createGarminParsingError,
  createKrdValidationError,
  createServiceApiError,
  createServiceAuthError,
  createTcxParsingError,
  createTcxValidationError,
  createToleranceExceededError,
  createZwiftParsingError,
  createZwiftValidationError,
} from "./domain/types/errors";

export type {
  ToleranceViolation,
  ValidationError,
} from "./domain/types/errors";

// ============================================
// Validation
// ============================================

export { createSchemaValidator } from "./domain/validation/schema-validator";
export type { SchemaValidator } from "./domain/validation/schema-validator";

export { validateKrd } from "./domain/validation/validate-krd";

export { extractWorkout } from "./domain/validation/extract-workout";

export {
  DEFAULT_TOLERANCES,
  createToleranceChecker,
  toleranceConfigSchema,
  toleranceViolationSchema,
} from "./domain/validation/tolerance-checker";
export type {
  ToleranceChecker,
  ToleranceConfig,
} from "./domain/validation/tolerance-checker";

// ============================================
// Ports (Generic Format Strategy)
// ============================================

export type {
  BinaryReader,
  BinaryWriter,
  TextReader,
  TextWriter,
} from "./ports/format-strategy";

export type { LogLevel, Logger } from "./ports/logger";
export { createConsoleLogger } from "./adapters/logger/console-logger";

// ============================================
// Ports (Remote Service)
// ============================================

export type { AuthProvider, TokenData } from "./ports/auth-provider";
export type { TokenStore } from "./ports/token-store";
export type {
  ListOptions,
  PushResult,
  WorkoutService,
  WorkoutSummary,
} from "./ports/workout-service";

// ============================================
// Conversion Functions
// ============================================

export { fromBinary, fromText } from "./application/from-format";
export { toBinary, toText } from "./application/to-format";

// ============================================
// Round-Trip Validation
// ============================================

export { validateRoundTrip } from "./tests/round-trip/validate-round-trip";
export type { ValidateRoundTrip } from "./tests/round-trip/validate-round-trip";
