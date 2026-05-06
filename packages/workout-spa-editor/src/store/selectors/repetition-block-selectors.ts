/**
 * Repetition-block selectors
 *
 * Hooks for the repetition-block editing flow: create / edit / ungroup /
 * delete a block, and add or duplicate steps inside an existing block.
 */

import { useWorkoutStore } from "../workout-store";

export const useCreateRepetitionBlock = () =>
  useWorkoutStore((state) => state.createRepetitionBlock);

export const useCreateEmptyRepetitionBlock = () =>
  useWorkoutStore((state) => state.createEmptyRepetitionBlock);

export const useEditRepetitionBlock = () =>
  useWorkoutStore((state) => state.editRepetitionBlock);

export const useAddStepToRepetitionBlock = () =>
  useWorkoutStore((state) => state.addStepToRepetitionBlock);

export const useDuplicateStepInRepetitionBlock = () =>
  useWorkoutStore((state) => state.duplicateStepInRepetitionBlock);

export const useUngroupRepetitionBlock = () =>
  useWorkoutStore((state) => state.ungroupRepetitionBlock);

export const useDeleteRepetitionBlock = () =>
  useWorkoutStore((state) => state.deleteRepetitionBlock);
