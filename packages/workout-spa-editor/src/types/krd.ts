/**
 * KRD Types - Unified Export
 *
 * This module provides a single import point for all KRD-related types.
 * Types are organized into focused modules:
 * - krd-core.ts: Core types re-exported from @kaiord/core
 * - krd-guards.ts: Type guard functions
 * - krd-ui.ts: UI-specific helper types
 */

export type {
  Duration,
  Equipment,
  Intensity,
  KRD,
  RepetitionBlock,
  Sport,
  SubSport,
  SwimStroke,
  Target,
  Workout,
  WorkoutStep,
} from "./krd-core";
export { isRepetitionBlock, isWorkoutStep } from "./krd-guards";
export type {
  DragState,
  RepetitionFormData,
  StepEditMode,
  StepFormData,
  UIRepetitionBlock,
  UIWorkout,
  UIWorkoutInner,
  UIWorkoutItem,
  UIWorkoutStep,
  ValidationError,
  WorkoutEditorState,
  WorkoutMetadata,
} from "./krd-ui";
