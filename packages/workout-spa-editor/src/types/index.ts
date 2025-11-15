/**
 * Types Module - Public API
 *
 * Centralized exports for all type definitions, schemas, and validation utilities.
 */

// ============================================
// KRD Types and Type Guards
// ============================================

export type {
  DragState,
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
  RepetitionBlockWithId,
  RepetitionFormData,
  Sport,
  StepEditMode,
  StepFormData,
  SubSport,
  SwimStroke,
  Target,
  TargetType,
  ValidationError,
  Workout,
  WorkoutEditorState,
  WorkoutItemWithId,
  WorkoutMetadata,
  WorkoutStep,
  WorkoutStepWithId,
} from "./krd";

export { isRepetitionBlock, isWorkoutStep } from "./krd";

// ============================================
// Schemas
// ============================================

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
  partialRepetitionBlockSchema,
  partialWorkoutStepSchema,
  repetitionBlockSchema,
  sportSchema,
  subSportSchema,
  swimStrokeSchema,
  targetSchema,
  targetTypeSchema,
  targetUnitSchema,
  validationErrorSchema,
  workoutMetadataFormSchema,
  workoutSchema,
  workoutStepSchema,
  workoutStepWithIdSchema,
} from "./schemas";

export type {
  PartialRepetitionBlock,
  PartialWorkoutStep,
  ValidationErrorType,
  WorkoutMetadataForm,
} from "./schemas";

// ============================================
// Validation Helpers
// ============================================

export {
  createDebouncedValidator,
  formatValidationErrors,
  formatZodError,
  getFieldError,
  getNestedErrors,
  hasFieldError,
  mergeValidationErrors,
  validateField,
  validatePartialRepetitionBlock,
  validatePartialWorkoutStep,
  validateRepetitionBlock,
  validateWorkout,
  validateWorkoutMetadata,
  validateWorkoutStep,
} from "./validation";

export type { ValidationResult } from "./validation";
