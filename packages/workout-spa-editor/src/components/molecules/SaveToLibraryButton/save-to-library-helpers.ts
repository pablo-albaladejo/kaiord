/**
 * Pure helpers for the save-to-library flow. Kept separate from the
 * hook so the hook can stay under the 40-line function budget and so
 * the payload builder is reachable from unit tests without rendering.
 */

import type { CreateTemplateOptions } from "../../../application/library/helpers/template-factory";
import type { KRD } from "../../../types/krd";
import type { DifficultyLevel } from "../../../types/workout-library";
import { calculateWorkoutDuration } from "./calculate-duration";
import { generateThumbnail } from "./generate-thumbnail";

export function extractSportFromWorkout(workout: KRD): string {
  const workoutData = workout.extensions?.structured_workout;
  return workoutData &&
    typeof workoutData === "object" &&
    "sport" in workoutData &&
    typeof workoutData.sport === "string"
    ? workoutData.sport
    : "cycling";
}

export function parseTags(tagsString: string): string[] {
  return tagsString
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

type FormState = {
  tags: string;
  difficulty: DifficultyLevel | "";
  notes: string;
};

export async function buildAddTemplateOptions(
  workout: KRD,
  form: FormState
): Promise<CreateTemplateOptions> {
  const thumbnailData = await generateThumbnail(workout);
  return {
    tags: parseTags(form.tags),
    difficulty: form.difficulty || undefined,
    duration: calculateWorkoutDuration(workout),
    notes: form.notes.trim() || undefined,
    thumbnailData,
  };
}
