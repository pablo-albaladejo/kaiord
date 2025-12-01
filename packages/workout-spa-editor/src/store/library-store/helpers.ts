/**
 * Library Store Helpers
 *
 * Helper functions for library store operations.
 */

import type { KRD } from "../../types/schemas";
import type {
  DifficultyLevel,
  WorkoutTemplate,
} from "../../types/workout-library";

export function createNewTemplate(
  name: string,
  sport: string,
  krd: KRD,
  options: {
    tags?: string[];
    difficulty?: DifficultyLevel;
    duration?: number;
    notes?: string;
    thumbnailData?: string;
  }
): WorkoutTemplate {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  return {
    id,
    name,
    sport,
    krd,
    tags: options.tags ?? [],
    difficulty: options.difficulty,
    duration: options.duration,
    notes: options.notes,
    thumbnailData: options.thumbnailData,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateTemplateData(
  template: WorkoutTemplate,
  updates: Partial<WorkoutTemplate>
): WorkoutTemplate {
  const now = new Date().toISOString();
  return {
    ...template,
    ...updates,
    updatedAt: now,
  };
}

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
