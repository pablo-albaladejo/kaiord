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
import type { WorkoutTemplate } from "../../../types/workout-library";
import { LibraryContent } from "./components/LibraryContent";
import { LibraryDialogHeader } from "./components/LibraryDialogHeader";
import { LibraryFilters } from "./components/LibraryFilters";
import { LoadConfirmDialog } from "./components/LoadConfirmDialog";
import { PreviewDialog } from "./components/PreviewDialog";
import { TagFilterButtons } from "./components/TagFilterButtons";
import { DIALOG_CONTENT_CLASSES, DIALOG_OVERLAY_CLASSES } from "./constants";
import { useWorkoutLibrary } from "./hooks/useWorkoutLibrary";

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
  const {
    templates,
    deleteTemplate,
    previewTemplate,
    setPreviewTemplate,
    handlePreview,
    handleLoadFromPreview,
    filters,
    loader,
  } = useWorkoutLibrary(hasCurrentWorkout, onLoadWorkout, onOpenChange);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={DIALOG_OVERLAY_CLASSES} />
        <Dialog.Content className={DIALOG_CONTENT_CLASSES}>
          <LibraryDialogHeader />

          <LibraryFilters
            searchTerm={filters.searchTerm}
            onSearchChange={filters.setSearchTerm}
            sportFilter={filters.sportFilter}
            onSportFilterChange={filters.setSportFilter}
            difficultyFilter={filters.difficultyFilter}
            onDifficultyFilterChange={filters.setDifficultyFilter}
            sortBy={filters.sortBy}
            onSortByChange={filters.setSortBy}
            sortOrder={filters.sortOrder}
            onSortOrderChange={filters.setSortOrder}
            onClearFilters={filters.clearFilters}
          />

          <TagFilterButtons
            allTags={filters.allTags}
            selectedTags={filters.selectedTags}
            onTagToggle={filters.handleTagToggle}
          />

          <LibraryContent
            templates={templates}
            filteredTemplates={filters.filteredAndSortedTemplates}
            hasActiveFilters={filters.hasActiveFilters}
            onLoadWorkout={loader.handleLoadWorkout}
            onDeleteWorkout={deleteTemplate}
            onPreviewWorkout={handlePreview}
            onClearFilters={filters.clearFilters}
          />

          <LoadConfirmDialog
            template={loader.loadConfirmTemplate}
            onConfirm={loader.confirmLoadWorkout}
            onCancel={loader.cancelLoadWorkout}
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
