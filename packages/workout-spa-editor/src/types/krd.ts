/**
 * KRD Types - Unified Export
 *
 * This module provides a single import point for all KRD-related types.
 * Types are organized into focused modules:
 * - krd-core.ts: Core types re-exported from @kaiord/core
 * - krd-guards.ts: Type guard functions
 * - krd-ui.ts: UI-specific helper types
 */

// Re-export core types
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
  Workout,
  WorkoutStep,
} from "./krd-core";

// Re-export type guards
export { isRepetitionBlock, isWorkoutStep } from "./krd-guards";

// Re-export UI types
export type {
  DragState,
  RepetitionBlockWithId,
  RepetitionFormData,
  StepEditMode,
  StepFormData,
  ValidationError,
  WorkoutEditorState,
  WorkoutItemWithId,
  WorkoutMetadata,
  WorkoutStepWithId,
} from "./krd-ui";
