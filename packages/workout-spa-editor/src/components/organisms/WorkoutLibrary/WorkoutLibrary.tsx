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
import { useLibraryStore } from "../../../store/library-store";
import type { WorkoutTemplate } from "../../../types/workout-library";
import { LibraryContent } from "./components/LibraryContent";
import { LibraryDialogHeader } from "./components/LibraryDialogHeader";
import { LibraryFilters } from "./components/LibraryFilters";
import { LoadConfirmDialog } from "./components/LoadConfirmDialog";
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

          <LibraryContent
            templates={templates}
            filteredTemplates={filteredAndSortedTemplates}
            hasActiveFilters={hasActiveFilters}
            onLoadWorkout={handleLoadWorkout}
            onDeleteWorkout={deleteTemplate}
            onClearFilters={clearFilters}
          />

          <LoadConfirmDialog
            template={loadConfirmTemplate}
            onConfirm={confirmLoadWorkout}
            onCancel={cancelLoadWorkout}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
