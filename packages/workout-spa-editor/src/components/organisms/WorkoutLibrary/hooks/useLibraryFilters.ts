/**
 * Library Filters Hook
 *
 * Manages filtering, searching, and sorting logic for the workout library.
 */

import { useMemo, useState } from "react";
import type { WorkoutTemplate } from "../../../../types/workout-library";
import {
  filterByDifficulty,
  filterBySearch,
  filterBySport,
  filterByTags,
} from "./filters/filter-utils";
import { sortTemplates } from "./filters/sort-utils";

type Difficulty = "easy" | "medium" | "hard";
type Sport = "cycling" | "running" | "swimming" | "generic";

export function useLibraryFilters(templates: WorkoutTemplate[]) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sportFilter, setSportFilter] = useState<Sport | "all">("all");
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "all">(
    "all"
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"name" | "date" | "difficulty">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const allTags = Array.from(
    new Set(templates.flatMap((t) => t.tags || []))
  ).sort();

  const filteredAndSortedTemplates = useMemo(() => {
    let filtered = templates;

    filtered = filterBySearch(filtered, searchTerm);
    filtered = filterBySport(filtered, sportFilter);
    filtered = filterByDifficulty(filtered, difficultyFilter);
    filtered = filterByTags(filtered, selectedTags);

    return sortTemplates(filtered, sortBy, sortOrder);
  }, [
    templates,
    searchTerm,
    sportFilter,
    difficultyFilter,
    selectedTags,
    sortBy,
    sortOrder,
  ]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSportFilter("all");
    setDifficultyFilter("all");
    setSelectedTags([]);
    setSortBy("date");
    setSortOrder("desc");
  };

  const hasActiveFilters =
    Boolean(searchTerm) ||
    sportFilter !== "all" ||
    difficultyFilter !== "all" ||
    selectedTags.length > 0;

  return {
    searchTerm,
    setSearchTerm,
    sportFilter,
    setSportFilter,
    difficultyFilter,
    setDifficultyFilter,
    selectedTags,
    allTags,
    handleTagToggle,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    filteredAndSortedTemplates,
    clearFilters,
    hasActiveFilters,
  };
}
