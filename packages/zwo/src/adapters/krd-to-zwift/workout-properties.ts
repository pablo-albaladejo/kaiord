import type { Sport } from "@kaiord/core";
import { sportCategory } from "@kaiord/core";

type ZwiftExtensions = Record<string, unknown>;

export const addWorkoutProperties = (
  workoutFile: Record<string, unknown>,
  workoutName: string | undefined,
  zwiftExtensions: ZwiftExtensions,
  notes?: string
): void => {
  if (zwiftExtensions.author) {
    workoutFile.author = zwiftExtensions.author;
  }
  if (workoutName) {
    workoutFile.name = workoutName;
  }
  // Canonical workout-level `notes` (krd-format) wins; fall back to the legacy
  // `zwift.description` so KRD produced before the notes field still exports.
  const description = notes ?? zwiftExtensions.description;
  if (description) {
    workoutFile.description = description;
  }
  if (zwiftExtensions.thresholdSecPerKm !== undefined) {
    workoutFile.thresholdSecPerKm = zwiftExtensions.thresholdSecPerKm;
  }

  const tags = zwiftExtensions.tags as Array<string> | undefined;
  if (tags && tags.length > 0) {
    workoutFile.tags = {
      tag: tags.map((name) => ({ "@_name": name })).filter((t) => t["@_name"]),
    };
  }
};

// ZWO is a cycling-trainer format that only supports "bike" and "run".
// Non-cycling/running sports (swimming, training, rowing, etc.) are
// collapsed to "bike" — this is an explicit, lossy mapping by design.
export const mapSportType = (sport?: string): string => {
  if (!sport) return "bike";
  const category = sportCategory(sport as Sport);
  if (category === "running") return "run";
  return "bike";
};
