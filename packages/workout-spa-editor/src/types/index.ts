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

export type {
  PartialRepetitionBlock,
  PartialWorkoutStep,
  ValidationErrorType,
  WorkoutMetadataForm,
} from "./schemas";
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

// ============================================
// Calendar Schemas
// ============================================

export type {
  AiMeta,
  Condition,
  ValueWithUnit,
  WorkoutComment,
  WorkoutFeedback,
  WorkoutRaw,
  WorkoutRecord,
  WorkoutState,
} from "./calendar-schemas";
export {
  aiMetaSchema,
  conditionSchema,
  valueWithUnitSchema,
  workoutCommentSchema,
  workoutFeedbackSchema,
  workoutRawSchema,
  workoutRecordSchema,
  workoutStateSchema,
} from "./calendar-schemas";

// ============================================
// Bridge Schemas
// ============================================

export type {
  BridgeCapability,
  BridgeErrorResponse,
  BridgeManifest,
  SyncState,
} from "./bridge-schemas";
export {
  bridgeCapabilitySchema,
  bridgeErrorResponseSchema,
  bridgeManifestSchema,
  syncStateSchema,
} from "./bridge-schemas";

// ============================================
// Usage Schemas
// ============================================

export type { UsageEntry, UsageRecord } from "./usage-schemas";
export { usageEntrySchema, usageRecordSchema } from "./usage-schemas";

// ============================================
// Validation Helpers
// ============================================

export type { ValidationResult } from "./validation";
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
