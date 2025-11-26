/**
 * Empty Library Component
 *
 * Displays when the workout library is empty or no results found.
 */

import { BookOpen } from "lucide-react";
import { Button } from "../../../atoms/Button";

type EmptyLibraryProps = {
  isFiltered: boolean;
  onClearFilters?: () => void;
};

export function EmptyLibrary({
  isFiltered,
  onClearFilters,
}: EmptyLibraryProps) {
  if (isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BookOpen className="mb-4 h-12 w-12 text-gray-400" />
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
          No workouts found
        </h3>
        <p className="mb-4 text-gray-600 dark:text-gray-400">
          No workouts match your current filters.
        </p>
        {onClearFilters && (
          <Button variant="secondary" onClick={onClearFilters}>
            Clear Filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <BookOpen className="mb-4 h-12 w-12 text-gray-400" />
      <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
        Your library is empty
      </h3>
      <p className="mb-4 text-gray-600 dark:text-gray-400">
        Create your first workout and save it to your library to get started.
      </p>
    </div>
  );
}
