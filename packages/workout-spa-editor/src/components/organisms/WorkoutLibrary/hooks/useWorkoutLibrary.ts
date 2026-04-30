/**
 * useWorkoutLibrary Hook
 *
 * Manages state and logic for the workout library component. Reads
 * templates reactively from Dexie and dispatches deletes through the
 * `deleteTemplate` use case; rejections surface via the toast context.
 */

import { useState } from "react";

import { deleteTemplate } from "../../../../application/library/delete-template";
import { usePersistence } from "../../../../contexts/persistence-context";
import { useToastContext } from "../../../../contexts/ToastContext";
import { useLibraryTemplatesLive } from "../../../../hooks/use-library-templates-live";
import type { WorkoutTemplate } from "../../../../types/workout-library";
import { useLibraryFilters } from "./useLibraryFilters";
import { useWorkoutLoader } from "./useWorkoutLoader";

const TOAST_ERROR = "Failed to delete template — please retry.";

export function useWorkoutLibrary(
  hasCurrentWorkout: boolean,
  onLoadWorkout: (template: WorkoutTemplate) => void,
  onOpenChange: (open: boolean) => void
) {
  const templates = useLibraryTemplatesLive() ?? [];
  const persistence = usePersistence();
  const toast = useToastContext();

  const [previewTemplate, setPreviewTemplate] =
    useState<WorkoutTemplate | null>(null);

  const filters = useLibraryFilters(templates);
  const loader = useWorkoutLoader(
    hasCurrentWorkout,
    onLoadWorkout,
    onOpenChange
  );

  const handleDelete = (templateId: string) => {
    void deleteTemplate(persistence, templateId).catch(() =>
      toast.error(TOAST_ERROR)
    );
  };

  const handlePreview = (template: WorkoutTemplate) => {
    setPreviewTemplate(template);
  };

  const handleLoadFromPreview = (template: WorkoutTemplate) => {
    setPreviewTemplate(null);
    loader.handleLoadWorkout(template);
  };

  return {
    templates,
    deleteTemplate: handleDelete,
    previewTemplate,
    setPreviewTemplate,
    handlePreview,
    handleLoadFromPreview,
    filters,
    loader,
  };
}
