/**
 * Template Filters
 *
 * Pure search / filter / aggregate helpers for the workout library.
 * Relocated from `store/library-store/helpers.ts`. Consumers call
 * these on the in-memory `WorkoutTemplate[]` from
 * `useLibraryTemplatesLive()`.
 */

import type { WorkoutTemplate } from "../../../types/workout-library";

export function searchInTemplates(
  templates: WorkoutTemplate[],
  query: string
): WorkoutTemplate[] {
  const lowerQuery = query.toLowerCase();
  return templates.filter((t) => t.name.toLowerCase().includes(lowerQuery));
}

export function filterTemplatesByTags(
  templates: WorkoutTemplate[],
  tags: string[]
): WorkoutTemplate[] {
  if (tags.length === 0) return templates;
  return templates.filter((t) => tags.every((tag) => t.tags.includes(tag)));
}

export function filterTemplatesBySport(
  templates: WorkoutTemplate[],
  sport: string
): WorkoutTemplate[] {
  return templates.filter((t) => t.sport === sport);
}

export function extractAllTags(templates: WorkoutTemplate[]): string[] {
  const allTags = templates.flatMap((t) => t.tags);
  return Array.from(new Set(allTags)).sort();
}
