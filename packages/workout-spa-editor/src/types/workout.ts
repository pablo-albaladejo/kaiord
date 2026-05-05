/**
 * Workout Domain - Types Barrel
 *
 * Re-exports KRD types, type guards, and Zod schemas that describe a workout
 * (the canonical KRD shape, its building blocks, and form-state companions).
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
