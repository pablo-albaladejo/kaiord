import type { WorkoutTemplate } from "../../../types/workout-library";

export type SportFilter = "all" | "cycling" | "running" | "swimming";

export type SportChip = {
  value: SportFilter;
  label: string;
};

export const SPORT_CHIPS: SportChip[] = [
  { value: "all", label: "All" },
  { value: "cycling", label: "Cycling" },
  { value: "running", label: "Running" },
  { value: "swimming", label: "Swim" },
];

/** Filters templates by case-insensitive title substring and sport. */
export function filterTemplates(
  templates: WorkoutTemplate[],
  query: string,
  sport: SportFilter
): WorkoutTemplate[] {
  const needle = query.trim().toLowerCase();
  return templates.filter((t) => {
    const matchesQuery = needle === "" || t.name.toLowerCase().includes(needle);
    const matchesSport = sport === "all" || t.sport === sport;
    return matchesQuery && matchesSport;
  });
}
