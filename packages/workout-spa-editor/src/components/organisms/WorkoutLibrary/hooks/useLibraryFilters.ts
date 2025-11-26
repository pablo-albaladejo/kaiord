/**
 * Library Filters Hook
 *
 * Manages filtering, searching, and sorting logic for the workout library.
 */

import { useMemo, useState } from "react";
import type { WorkoutTemplate } from "../../../../types/workout-library";

type Difficulty = "easy" | "medium" | "hard";
type Sport = "cycling" | "running" | "swimming" | "generic";

export function useLibraryFilters(templates: WorkoutTemplate[]) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sportFilter, setSportFilter] = useState<Sport | "all">("all");
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "all">(
    "all"
  );
  const [sortBy, setSortBy] = useState<"name" | "date" | "difficulty">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const filteredAndSortedTemplates = useMemo(() => {
    let filtered = templates;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (template) =>
          template.name.toLowerCase().includes(term) ||
          template.notes?.toLowerCase().includes(term) ||
          template.tags?.some((tag) => tag.toLowerCase().includes(term))
      );
    }

    if (sportFilter !== "all") {
      filtered = filtered.filter((template) => template.sport === sportFilter);
    }

    if (difficultyFilter !== "all") {
      filtered = filtered.filter(
        (template) => template.difficulty === difficultyFilter
      );
    }

    filtered.sort((a, b) => {
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

    return filtered;
  }, [templates, searchTerm, sportFilter, difficultyFilter, sortBy, sortOrder]);

  const clearFilters = () => {
    setSearchTerm("");
    setSportFilter("all");
    setDifficultyFilter("all");
    setSortBy("date");
    setSortOrder("desc");
  };

  const hasActiveFilters =
    Boolean(searchTerm) || sportFilter !== "all" || difficultyFilter !== "all";

  return {
    searchTerm,
    setSearchTerm,
    sportFilter,
    setSportFilter,
    difficultyFilter,
    setDifficultyFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    filteredAndSortedTemplates,
    clearFilters,
    hasActiveFilters,
  };
}
