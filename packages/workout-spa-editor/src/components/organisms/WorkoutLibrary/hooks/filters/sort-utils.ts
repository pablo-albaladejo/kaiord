/**
 * Sort Utilities
 *
 * Helper functions for sorting workout templates.
 */

import type { WorkoutTemplate } from "../../../../../types/workout-library";

type SortBy = "name" | "date" | "difficulty";
type SortOrder = "asc" | "desc";

export function sortTemplates(
  templates: WorkoutTemplate[],
  sortBy: SortBy,
  sortOrder: SortOrder
): WorkoutTemplate[] {
  const sorted = [...templates];

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "date":
        comparison =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case "difficulty": {
        const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
        const aDiff =
          difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 0;
        const bDiff =
          difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 0;
        comparison = aDiff - bDiff;
        break;
      }
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  return sorted;
}
