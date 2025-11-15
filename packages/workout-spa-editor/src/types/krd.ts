/**
 * KRD Types - Re-exported from @kaiord/core
 *
 * This module re-exports core KRD types and adds UI-specific helper types.
 */

// ============================================
// Core KRD Types (re-exported from @kaiord/core)
// ============================================

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
} from "@kaiord/core";

// ============================================
// Type Guards
// ============================================

import type { RepetitionBlock, Workout, WorkoutStep } from "@kaiord/core";

/**
 * Type guard to check if a step is a RepetitionBlock
 */
export const isRepetitionBlock = (
  step: WorkoutStep | RepetitionBlock
): step is RepetitionBlock => {
  return "repeatCount" in step && "steps" in step;
};

/**
 * Type guard to check if a step is a WorkoutStep
 */
export const isWorkoutStep = (
  step: WorkoutStep | RepetitionBlock
): step is WorkoutStep => {
  return "stepIndex" in step && !("repeatCount" in step);
};

// ============================================
// UI Helper Types
// ============================================

/**
 * Represents a step or block with a unique ID for React rendering
 */
export type WorkoutStepWithId = WorkoutStep & {
  id: string;
};

export type RepetitionBlockWithId = RepetitionBlock & {
  id: string;
  steps: Array<WorkoutStepWithId>;
};

export type WorkoutItemWithId = WorkoutStepWithId | RepetitionBlockWithId;

/**
 * Editor state for a workout
 */
export type WorkoutEditorState = {
  workout: Workout | null;
  selectedStepId: string | null;
  isDirty: boolean;
  validationErrors: Array<ValidationError>;
};

/**
 * Form data for creating/editing a workout step
 */
export type StepFormData = Partial<WorkoutStep> & {
  id?: string;
};

/**
 * Form data for creating/editing a repetition block
 */
export type RepetitionFormData = {
  id?: string;
  repeatCount: number;
  steps: Array<StepFormData>;
};

/**
 * Validation error with field path
 */
export type ValidationError = {
  path: Array<string | number>;
  message: string;
  code?: string;
};

/**
 * UI state for step editing
 */
export type StepEditMode = "view" | "edit" | "create";

/**
 * Drag and drop state
 */
export type DragState = {
  draggedItemId: string | null;
  dropTargetId: string | null;
  dropPosition: "before" | "after" | "inside" | null;
};

/**
 * Workout metadata for display
 */
export type WorkoutMetadata = {
  name?: string;
  sport: string;
  subSport?: string;
  totalSteps: number;
  estimatedDuration?: number;
  poolLength?: number;
  poolLengthUnit?: "meters";
};
