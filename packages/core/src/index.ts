/**
 * @kaiord/core - Public API
 * Bidirectional conversion between FIT workout files and KRD format
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

// ============================================
// Error Types and Factories
// ============================================

export {
  FitParsingError,
  KrdValidationError,
  TcxParsingError,
  TcxValidationError,
  ToleranceExceededError,
  createFitParsingError,
  createKrdValidationError,
  createTcxParsingError,
  createTcxValidationError,
  createToleranceExceededError,
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
// Ports (Contracts)
// ============================================

export type { FitReader } from "./ports/fit-reader";
export type { FitWriter } from "./ports/fit-writer";
export type { LogLevel, Logger } from "./ports/logger";
export type { TcxReader } from "./ports/tcx-reader";
export type { TcxValidationResult, TcxValidator } from "./ports/tcx-validator";
export type { TcxWriter } from "./ports/tcx-writer";

// ============================================
// Use Cases
// ============================================

export { convertFitToKrd } from "./application/use-cases/convert-fit-to-krd";
export type { ConvertFitToKrd } from "./application/use-cases/convert-fit-to-krd";

export { convertKrdToFit } from "./application/use-cases/convert-krd-to-fit";
export type { ConvertKrdToFit } from "./application/use-cases/convert-krd-to-fit";

export { convertTcxToKrd } from "./application/use-cases/convert-tcx-to-krd";
export type { ConvertTcxToKrd } from "./application/use-cases/convert-tcx-to-krd";

export { convertKrdToTcx } from "./application/use-cases/convert-krd-to-tcx";
export type { ConvertKrdToTcx } from "./application/use-cases/convert-krd-to-tcx";

export { validateRoundTrip } from "./tests/round-trip/validate-round-trip";
export type { ValidateRoundTrip } from "./tests/round-trip/validate-round-trip";

// ============================================
// Dependency Injection
// ============================================

export { createDefaultProviders } from "./application/providers";
export type { Providers } from "./application/providers";
