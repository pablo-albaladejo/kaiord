/**
 * Library Page Grid
 *
 * Card grid for the library page with schedule action per card.
 */

import type { WorkoutTemplate } from "../../types/workout-library";
import { LibraryPageCard } from "./LibraryPageCard";

type LibraryPageGridProps = {
  templates: WorkoutTemplate[];
  filtered: WorkoutTemplate[];
  onDelete: (template: WorkoutTemplate) => void;
  onSchedule: (template: WorkoutTemplate) => void;
};

export function LibraryPageGrid({
  templates,
  filtered,
  onDelete,
  onSchedule,
}: LibraryPageGridProps) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => (
          <LibraryPageCard
            key={t.id}
            template={t}
            onDelete={() => onDelete(t)}
            onSchedule={() => onSchedule(t)}
          />
        ))}
      </div>
      <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Showing {filtered.length} of {templates.length} workouts
      </div>
    </>
  );
}
