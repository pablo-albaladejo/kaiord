import { getTranslate, type Translate } from "../../../i18n/use-translate";
import type { WorkoutTemplate } from "../../../types/workout-library";

export type SportFilter = "all" | "cycling" | "running" | "swimming";

export type SportChip = {
  value: SportFilter;
  label: string;
};

export function getSportChips(
  t: Translate = getTranslate("library")
): SportChip[] {
  return [
    { value: "all", label: t("sport.all") },
    { value: "cycling", label: t("sport.cycling") },
    { value: "running", label: t("sport.running") },
    { value: "swimming", label: t("sport.swim") },
  ];
}

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
