import { useMemo } from "react";
import type { WorkoutTemplate } from "../../../../types/workout-library";
import { applyFilters } from "./apply-filters";
import { sortTemplates } from "./filters/sort-utils";
import { useFilterState } from "./useFilterState";

export function useLibraryFilters(templates: WorkoutTemplate[]) {
  const filterState = useFilterState();

  const allTags = Array.from(
    new Set(templates.flatMap((t) => t.tags || []))
  ).sort();

  const filteredAndSortedTemplates = useMemo(() => {
    const filtered = applyFilters(
      templates,
      filterState.searchTerm,
      filterState.sportFilter,
      filterState.difficultyFilter,
      filterState.selectedTags
    );
    return sortTemplates(filtered, filterState.sortBy, filterState.sortOrder);
  }, [
    templates,
    filterState.searchTerm,
    filterState.sportFilter,
    filterState.difficultyFilter,
    filterState.selectedTags,
    filterState.sortBy,
    filterState.sortOrder,
  ]);

  const handleTagToggle = (tag: string) => {
    filterState.setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return {
    ...filterState,
    allTags,
    handleTagToggle,
    filteredAndSortedTemplates,
  };
}
