/**
 * Library Filters Component
 *
 * Provides filtering and sorting controls for the workout library.
 */

import { DifficultyFilter } from "./filters/DifficultyFilter";
import { SearchInput } from "./filters/SearchInput";
import { SortBySelect } from "./filters/SortBySelect";
import { SortOrderSelect } from "./filters/SortOrderSelect";
import { SportFilter } from "./filters/SportFilter";
import { Button } from "../../../atoms/Button/Button";

type Difficulty = "easy" | "medium" | "hard";
type Sport = "cycling" | "running" | "swimming" | "generic";

type LibraryFiltersProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sportFilter: Sport | "all";
  onSportFilterChange: (value: Sport | "all") => void;
  difficultyFilter: Difficulty | "all";
  onDifficultyFilterChange: (value: Difficulty | "all") => void;
  sortBy: "name" | "date" | "difficulty";
  onSortByChange: (value: "name" | "date" | "difficulty") => void;
  sortOrder: "asc" | "desc";
  onSortOrderChange: (value: "asc" | "desc") => void;
  onClearFilters: () => void;
};

export function LibraryFilters({
  searchTerm,
  onSearchChange,
  sportFilter,
  onSportFilterChange,
  difficultyFilter,
  onDifficultyFilterChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  onClearFilters,
}: LibraryFiltersProps) {
  return (
    <div className="mb-6 space-y-4">
      <SearchInput value={searchTerm} onChange={onSearchChange} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <SportFilter value={sportFilter} onChange={onSportFilterChange} />
        <DifficultyFilter
          value={difficultyFilter}
          onChange={onDifficultyFilterChange}
        />
        <SortBySelect value={sortBy} onChange={onSortByChange} />
        <SortOrderSelect value={sortOrder} onChange={onSortOrderChange} />
      </div>

      <div className="flex justify-end">
        <Button variant="secondary" onClick={onClearFilters}>
          Clear Filters
        </Button>
      </div>
    </div>
  );
}
