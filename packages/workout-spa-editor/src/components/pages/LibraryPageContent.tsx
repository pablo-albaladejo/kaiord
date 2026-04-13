/**
 * Library Page Content
 *
 * Renders library filters, grid, and schedule dialog.
 * Reuses WorkoutLibrary sub-components without dialog chrome.
 */

import { useState } from "react";

import type { WorkoutTemplate } from "../../types/workout-library";
import { DeleteWorkoutDialog } from "../organisms/WorkoutLibrary/components/DeleteWorkoutDialog";
import { EmptyLibrary } from "../organisms/WorkoutLibrary/components/EmptyLibrary";
import { LibraryFilters } from "../organisms/WorkoutLibrary/components/LibraryFilters";
import { TagFilterButtons } from "../organisms/WorkoutLibrary/components/TagFilterButtons";
import { useLibraryFilters } from "../organisms/WorkoutLibrary/hooks/useLibraryFilters";
import { LibraryPageGrid } from "./LibraryPageGrid";

type LibraryPageContentProps = {
  templates: WorkoutTemplate[];
  onDelete: (id: string) => void;
  onSchedule: (template: WorkoutTemplate) => void;
};

export function LibraryPageContent({
  templates,
  onDelete,
  onSchedule,
}: LibraryPageContentProps) {
  const filters = useLibraryFilters(templates);
  const [deleteTarget, setDeleteTarget] = useState<WorkoutTemplate | null>(
    null
  );

  const handleConfirmDelete = () => {
    if (deleteTarget) onDelete(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <>
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
      {filters.filteredAndSortedTemplates.length === 0 ? (
        <EmptyLibrary
          isFiltered={filters.hasActiveFilters}
          onClearFilters={filters.clearFilters}
        />
      ) : (
        <LibraryPageGrid
          templates={templates}
          filtered={filters.filteredAndSortedTemplates}
          onDelete={setDeleteTarget}
          onSchedule={onSchedule}
        />
      )}
      <DeleteWorkoutDialog
        open={deleteTarget !== null}
        workoutName={deleteTarget?.name ?? ""}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
