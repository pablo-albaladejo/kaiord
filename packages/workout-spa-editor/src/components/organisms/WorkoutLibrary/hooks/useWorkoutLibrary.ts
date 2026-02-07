/**
 * useWorkoutLibrary Hook
 *
 * Manages state and logic for the workout library component.
 */

import { useState } from "react";
import { useLibraryFilters } from "./useLibraryFilters";
import { useWorkoutLoader } from "./useWorkoutLoader";
import { useLibraryStore } from "../../../../store/library-store";
import type { WorkoutTemplate } from "../../../../types/workout-library";

export function useWorkoutLibrary(
  hasCurrentWorkout: boolean,
  onLoadWorkout: (template: WorkoutTemplate) => void,
  onOpenChange: (open: boolean) => void
) {
  const { templates, deleteTemplate } = useLibraryStore();
  const [previewTemplate, setPreviewTemplate] =
    useState<WorkoutTemplate | null>(null);

  const filters = useLibraryFilters(templates);
  const loader = useWorkoutLoader(
    hasCurrentWorkout,
    onLoadWorkout,
    onOpenChange
  );

  const handlePreview = (template: WorkoutTemplate) => {
    setPreviewTemplate(template);
  };

  const handleLoadFromPreview = (template: WorkoutTemplate) => {
    setPreviewTemplate(null);
    loader.handleLoadWorkout(template);
  };

  return {
    templates,
    deleteTemplate,
    previewTemplate,
    setPreviewTemplate,
    handlePreview,
    handleLoadFromPreview,
    filters,
    loader,
  };
}
