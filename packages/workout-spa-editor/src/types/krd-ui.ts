/**
 * KRD UI Helper Types.
 *
 * Stable-id types (`UIWorkout`, `UIWorkoutStep`, `UIRepetitionBlock`, …)
 * live in `./ui-workout`; re-exported here for convenience.
 */

import type { Workout, WorkoutStep } from "@kaiord/core";

export type {
  UIRepetitionBlock,
  UIWorkout,
  UIWorkoutInner,
  UIWorkoutItem,
  UIWorkoutStep,
} from "./ui-workout";

export type WorkoutEditorState = {
  workout: Workout | null;
  selectedStepId: string | null;
  isDirty: boolean;
  validationErrors: Array<ValidationError>;
};

export type StepFormData = Partial<WorkoutStep> & {
  id?: string;
};

export type RepetitionFormData = {
  id?: string;
  repeatCount: number;
  steps: Array<StepFormData>;
};

export type ValidationError = {
  path: Array<string | number>;
  message: string;
  code?: string;
};

export type StepEditMode = "view" | "edit" | "create";

export type DragState = {
  draggedItemId: string | null;
  dropTargetId: string | null;
  dropPosition: "before" | "after" | "inside" | null;
};

export type WorkoutMetadata = {
  name?: string;
  sport: string;
  subSport?: string;
  totalSteps: number;
  estimatedDuration?: number;
  poolLength?: number;
  poolLengthUnit?: "meters";
};
