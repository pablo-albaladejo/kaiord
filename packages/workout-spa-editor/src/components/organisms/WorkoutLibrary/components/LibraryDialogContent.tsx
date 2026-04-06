import type { WorkoutTemplate } from "../../../../types/workout-library";
import type {
  LibraryFilters as LibraryFiltersType,
  LibraryLoader,
} from "../types";
import { LibraryContent } from "./LibraryContent";
import { LibraryDialogHeader } from "./LibraryDialogHeader";
import { LibraryFilters } from "./LibraryFilters";
import { LoadConfirmDialog } from "./LoadConfirmDialog";
import { PreviewDialog } from "./PreviewDialog";
import { TagFilterButtons } from "./TagFilterButtons";

type LibraryDialogContentProps = {
  templates: WorkoutTemplate[];
  previewTemplate: WorkoutTemplate | null;
  filters: LibraryFiltersType;
  loader: LibraryLoader;
  onDeleteWorkout: (id: string) => void;
  onPreviewWorkout: (template: WorkoutTemplate) => void;
  onClosePreview: () => void;
  onLoadFromPreview: (template: WorkoutTemplate) => void;
};

export function LibraryDialogContent({
  templates,
  previewTemplate,
  filters,
  loader,
  onDeleteWorkout,
  onPreviewWorkout,
  onClosePreview,
  onLoadFromPreview,
}: LibraryDialogContentProps) {
  return (
    <>
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
        onDeleteWorkout={onDeleteWorkout}
        onPreviewWorkout={onPreviewWorkout}
        onClearFilters={filters.clearFilters}
      />

      <LoadConfirmDialog
        template={loader.loadConfirmTemplate}
        onConfirm={loader.confirmLoadWorkout}
        onCancel={loader.cancelLoadWorkout}
      />

      <PreviewDialog
        template={previewTemplate}
        onClose={onClosePreview}
        onLoad={onLoadFromPreview}
      />
    </>
  );
}
