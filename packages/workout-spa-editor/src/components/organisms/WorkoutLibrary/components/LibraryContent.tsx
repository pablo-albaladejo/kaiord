/**
 * Library Content Component
 *
 * Main content area showing workout grid or empty state.
 */

import { EmptyLibrary } from "./EmptyLibrary";
import { WorkoutCard } from "./WorkoutCard";
import type { WorkoutTemplate } from "../../../../types/workout-library";

type LibraryContentProps = {
  templates: WorkoutTemplate[];
  filteredTemplates: WorkoutTemplate[];
  hasActiveFilters: boolean;
  onLoadWorkout: (template: WorkoutTemplate) => void;
  onDeleteWorkout: (templateId: string) => void;
  onPreviewWorkout: (template: WorkoutTemplate) => void;
  onClearFilters: () => void;
};

export function LibraryContent({
  templates,
  filteredTemplates,
  hasActiveFilters,
  onLoadWorkout,
  onDeleteWorkout,
  onPreviewWorkout,
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
            onPreview={onPreviewWorkout}
          />
        ))}
      </div>
      <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Showing {filteredTemplates.length} of {templates.length} workouts
      </div>
    </>
  );
}
