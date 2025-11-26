/**
 * WorkoutLibrary Component
 *
 * Grid view of saved workouts with search, filter, and sort capabilities.
 *
 * Requirements:
 * - Requirement 17: Save workouts to library
 * - Requirement 18: Load workouts from library
 */

import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { useLibraryStore } from "../../../store/library-store";
import type { WorkoutTemplate } from "../../../types/workout-library";
import { LibraryContent } from "./components/LibraryContent";
import { LibraryDialogHeader } from "./components/LibraryDialogHeader";
import { LibraryFilters } from "./components/LibraryFilters";
import { LoadConfirmDialog } from "./components/LoadConfirmDialog";
import { PreviewDialog } from "./components/PreviewDialog";
import { DIALOG_CONTENT_CLASSES, DIALOG_OVERLAY_CLASSES } from "./constants";
import { useLibraryFilters } from "./hooks/useLibraryFilters";
import { useWorkoutLoader } from "./hooks/useWorkoutLoader";

export type WorkoutLibraryProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadWorkout: (template: WorkoutTemplate) => void;
  hasCurrentWorkout?: boolean;
};

export const WorkoutLibrary: React.FC<WorkoutLibraryProps> = ({
  open,
  onOpenChange,
  onLoadWorkout,
  hasCurrentWorkout = false,
}) => {
  const { templates, deleteTemplate } = useLibraryStore();
  const {
    searchTerm,
    setSearchTerm,
    sportFilter,
    setSportFilter,
    difficultyFilter,
    setDifficultyFilter,
    selectedTags,
    allTags,
    handleTagToggle,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    filteredAndSortedTemplates,
    clearFilters,
    hasActiveFilters,
  } = useLibraryFilters(templates);

  const {
    loadConfirmTemplate,
    handleLoadWorkout,
    confirmLoadWorkout,
    cancelLoadWorkout,
  } = useWorkoutLoader(hasCurrentWorkout, onLoadWorkout, onOpenChange);

  const [previewTemplate, setPreviewTemplate] =
    useState<WorkoutTemplate | null>(null);

  const handlePreview = (template: WorkoutTemplate) => {
    setPreviewTemplate(template);
  };

  const handleLoadFromPreview = (template: WorkoutTemplate) => {
    setPreviewTemplate(null);
    handleLoadWorkout(template);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={DIALOG_OVERLAY_CLASSES} />
        <Dialog.Content className={DIALOG_CONTENT_CLASSES}>
          <LibraryDialogHeader />

          <LibraryFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            sportFilter={sportFilter}
            onSportFilterChange={setSportFilter}
            difficultyFilter={difficultyFilter}
            onDifficultyFilterChange={setDifficultyFilter}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            onClearFilters={clearFilters}
          />

          <TagFilterButtons
            allTags={allTags}
            selectedTags={selectedTags}
            onTagToggle={handleTagToggle}
          />

          <LibraryContent
            templates={templates}
            filteredTemplates={filteredAndSortedTemplates}
            hasActiveFilters={hasActiveFilters}
            onLoadWorkout={handleLoadWorkout}
            onDeleteWorkout={deleteTemplate}
            onPreviewWorkout={handlePreview}
            onClearFilters={clearFilters}
          />

          <LoadConfirmDialog
            template={loadConfirmTemplate}
            onConfirm={confirmLoadWorkout}
            onCancel={cancelLoadWorkout}
          />

          <PreviewDialog
            template={previewTemplate}
            onClose={() => setPreviewTemplate(null)}
            onLoad={handleLoadFromPreview}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
