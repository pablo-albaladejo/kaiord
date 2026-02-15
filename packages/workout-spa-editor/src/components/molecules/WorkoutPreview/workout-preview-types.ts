/**
 * Workout Preview Types
 *
 * Type definitions for the workout preview bar chart.
 */

import type { Intensity, Workout } from "../../../types/krd";

export type PreviewBar = {
  id: string;
  stepId: string;
  durationSeconds: number;
  normalizedHeight: number;
  color: string;
  intensity: Intensity | undefined;
};

export type WorkoutPreviewProps = {
  workout: Workout;
  selectedStepId?: string | null;
  onStepSelect?: (stepId: string) => void;
  className?: string;
  height?: number;
};

export type WorkoutPreviewBarProps = {
  x: number;
  width: number;
  height: number;
  maxHeight: number;
  color: string;
  isSelected: boolean;
  onClick: () => void;
  ariaLabel: string;
};
