import { useState } from "react";
import type { Difficulty, Sport } from "./useLibraryFilters.types";

export function useFilterState() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sportFilter, setSportFilter] = useState<Sport | "all">("all");
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "all">(
    "all"
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"name" | "date" | "difficulty">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

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
    setSelectedTags,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    clearFilters,
    hasActiveFilters,
  };
}
