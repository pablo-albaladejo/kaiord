/**
 * Template Factory
 *
 * Pure constructors / updaters for WorkoutTemplate. Relocated from
 * `store/library-store/helpers.ts` so the application use cases own
 * their inputs and the legacy Zustand store can be deleted.
 */

import { stripIds } from "../../../store/strip-ids";
import type { KRD } from "../../../types/schemas";
import type {
  DifficultyLevel,
  WorkoutTemplate,
} from "../../../types/workout-library";

export type CreateTemplateOptions = {
  tags?: string[];
  difficulty?: DifficultyLevel;
  duration?: number;
  notes?: string;
  thumbnailData?: string;
};

export function createNewTemplate(
  name: string,
  sport: string,
  krd: KRD,
  options: CreateTemplateOptions = {}
): WorkoutTemplate {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  return {
    id,
    name,
    sport,
    // stripIds chokepoint: UIWorkout ids never leak into persisted KRDs.
    krd: stripIds(krd),
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
  const normalized = updates.krd
    ? { ...updates, krd: stripIds(updates.krd) }
    : updates;
  return {
    ...template,
    ...normalized,
    updatedAt: now,
  };
}
