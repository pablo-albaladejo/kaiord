/**
 * Library Content Component
 *
 * Main content area showing workout grid or empty state.
 */

import type { WorkoutTemplate } from "../../../../types/workout-library";
import { EmptyLibrary } from "./EmptyLibrary";
import { WorkoutCard } from "./WorkoutCard";

interface LibraryContentProps {
  templates: WorkoutTemplate[];
  filteredTemplates: WorkoutTemplate[];
  hasActiveFilters: boolean;
  onLoadWorkout: (template: WorkoutTemplate) => void;
  onDeleteWorkout: (templateId: string) => void;
  onClearFilters: () => void;
}

export function LibraryContent({
  templates,
  filteredTemplates,
  hasActiveFilters,
  onLoadWorkout,
  onDeleteWorkout,
  onClearFilters,
}: LibraryContentProps) {
  if (filteredTemplates.length === 0) {
    return (
      <EmptyLibrary
        isFiltered={hasActiveFilters}
        onClearFilters={onClearFilters}
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => (
          <WorkoutCard
            key={template.id}
            template={template}
            onLoad={onLoadWorkout}
            onDelete={onDeleteWorkout}
          />
        ))}
      </div>
      <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Showing {filteredTemplates.length} of {templates.length} workouts
      </div>
    </>
  );
}
