/**
 * Library Filters Component
 *
 * Provides filtering and sorting controls for the workout library.
 */

import { Button } from "../../../atoms/Button/Button";
import { Input } from "../../../atoms/Input/Input";

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
      <div>
        <Input
          type="text"
          placeholder="Search workouts..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Sport
          </label>
          <select
            value={sportFilter}
            onChange={(e) =>
              onSportFilterChange(e.target.value as Sport | "all")
            }
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="all">All Sports</option>
            <option value="cycling">Cycling</option>
            <option value="running">Running</option>
            <option value="swimming">Swimming</option>
            <option value="generic">Generic</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Difficulty
          </label>
          <select
            value={difficultyFilter}
            onChange={(e) =>
              onDifficultyFilterChange(e.target.value as Difficulty | "all")
            }
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="all">All Levels</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) =>
              onSortByChange(e.target.value as "name" | "date" | "difficulty")
            }
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="name">Name</option>
            <option value="date">Date Created</option>
            <option value="difficulty">Difficulty</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Order
          </label>
          <select
            value={sortOrder}
            onChange={(e) =>
              onSortOrderChange(e.target.value as "asc" | "desc")
            }
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="secondary" onClick={onClearFilters}>
          Clear Filters
        </Button>
      </div>
    </div>
  );
}
