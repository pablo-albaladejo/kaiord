/**
 * Workout-level selectors
 *
 * Hooks that read or mutate the top-level workout entity (load, update,
 * clear, edit-mode flag). Each selector is exported individually so that
 * components subscribe only to the slice they need and avoid extra
 * re-renders.
 */

import { useWorkoutStore } from "../workout-store";

export const useCurrentWorkout = () =>
  useWorkoutStore((state) => state.currentWorkout);

export const useIsEditing = () => useWorkoutStore((state) => state.isEditing);

export const useLoadWorkout = () =>
  useWorkoutStore((state) => state.loadWorkout);

export const useUpdateWorkout = () =>
  useWorkoutStore((state) => state.updateWorkout);

export const useSetEditing = () => useWorkoutStore((state) => state.setEditing);

export const useClearWorkout = () =>
  useWorkoutStore((state) => state.clearWorkout);

export const useCreateEmptyWorkout = () =>
  useWorkoutStore((state) => state.createEmptyWorkout);
