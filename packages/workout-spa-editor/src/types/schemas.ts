/**
 * Zod Schemas for Validation
 *
 * Re-exports core schemas and adds UI-specific validation schemas.
 *
 * This module consolidates schema exports from focused submodules.
 */

// Re-export core schemas and types from @kaiord/core
export {
  durationSchema,
  durationTypeSchema,
  equipmentSchema,
  intensitySchema,
  krdEventSchema,
  krdLapSchema,
  krdMetadataSchema,
  krdRecordSchema,
  krdSchema,
  krdSessionSchema,
  repetitionBlockSchema,
  sportSchema,
  subSportSchema,
  swimStrokeSchema,
  targetSchema,
  targetTypeSchema,
  targetUnitSchema,
  workoutSchema,
  workoutStepSchema,
} from "./schemas/core-exports";

export type {
  Duration,
  DurationType,
  Equipment,
  Intensity,
  KRD,
  KRDEvent,
  KRDLap,
  KRDMetadata,
  KRDRecord,
  KRDSession,
  RepetitionBlock,
  Sport,
  SubSport,
  SwimStroke,
  Target,
  TargetType,
  TargetUnit,
  Workout,
  WorkoutStep,
} from "./schemas/core-exports";

// Re-export form validation schemas
export type {
  PartialRepetitionBlock,
  PartialWorkoutStep,
  WorkoutMetadataForm,
} from "./schemas/form-schemas";

export {
  partialRepetitionBlockSchema,
  partialWorkoutStepSchema,
  workoutMetadataFormSchema,
} from "./schemas/form-schemas";

// Re-export UI-specific schemas
export type {
  ValidationErrorType,
  WorkoutStepWithId,
} from "./schemas/ui-schemas";

export {
  validationErrorSchema,
  workoutStepWithIdSchema,
} from "./schemas/ui-schemas";
