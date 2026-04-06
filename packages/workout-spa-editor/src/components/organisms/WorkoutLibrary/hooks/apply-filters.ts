import type { WorkoutTemplate } from "../../../../types/workout-library";
import {
  filterByDifficulty,
  filterBySearch,
  filterBySport,
  filterByTags,
} from "./filters/filter-utils";
import type { Difficulty, Sport } from "./useLibraryFilters.types";

export function applyFilters(
  templates: WorkoutTemplate[],
  searchTerm: string,
  sportFilter: Sport | "all",
  difficultyFilter: Difficulty | "all",
  selectedTags: string[]
): WorkoutTemplate[] {
  let filtered = templates;
  filtered = filterBySearch(filtered, searchTerm);
  filtered = filterBySport(filtered, sportFilter);
  filtered = filterByDifficulty(filtered, difficultyFilter);
  filtered = filterByTags(filtered, selectedTags);
  return filtered;
}
