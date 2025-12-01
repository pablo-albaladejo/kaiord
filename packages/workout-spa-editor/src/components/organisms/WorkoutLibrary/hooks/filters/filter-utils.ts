/**
 * Filter Utilities
 *
 * Helper functions for filtering workout templates.
 */

import type { WorkoutTemplate } from "../../../../../types/workout-library";

type Difficulty = "easy" | "medium" | "hard";
type Sport = "cycling" | "running" | "swimming" | "generic";

export function filterBySearch(
  templates: WorkoutTemplate[],
  searchTerm: string
): WorkoutTemplate[] {
  if (!searchTerm) return templates;

  const term = searchTerm.toLowerCase();
  return templates.filter(
    (template) =>
      template.name.toLowerCase().includes(term) ||
      template.notes?.toLowerCase().includes(term) ||
      template.tags?.some((tag) => tag.toLowerCase().includes(term))
  );
}

export function filterBySport(
  templates: WorkoutTemplate[],
  sport: Sport | "all"
): WorkoutTemplate[] {
  if (sport === "all") return templates;
  return templates.filter((template) => template.sport === sport);
}

export function filterByDifficulty(
  templates: WorkoutTemplate[],
  difficulty: Difficulty | "all"
): WorkoutTemplate[] {
  if (difficulty === "all") return templates;
  return templates.filter((template) => template.difficulty === difficulty);
}

export function filterByTags(
  templates: WorkoutTemplate[],
  selectedTags: string[]
): WorkoutTemplate[] {
  if (selectedTags.length === 0) return templates;
  return templates.filter((template) =>
    selectedTags.every((tag) => template.tags?.includes(tag))
  );
}
