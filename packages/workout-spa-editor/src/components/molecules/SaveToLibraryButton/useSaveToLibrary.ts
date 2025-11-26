/**
 * Save to Library Hook
 *
 * Hook for saving workouts to the library.
 */

import { useState } from "react";
import { useToastContext } from "../../../contexts/ToastContext";
import { useLibraryStore } from "../../../store/library-store";
import type { KRD } from "../../../types/krd";
import type { DifficultyLevel } from "../../../types/workout-library";
import { generateThumbnail } from "./generate-thumbnail";
import { calculateWorkoutDuration, extractSportFromWorkout } from "./helpers";

export const useSaveToLibrary = () => {
  const { addTemplate } = useLibraryStore();
  const { success, error: showError } = useToastContext();
  const [isSaving, setIsSaving] = useState(false);

  const saveWorkout = async (
    workout: KRD,
    name: string,
    tags: string,
    difficulty: DifficultyLevel | "",
    notes: string
  ) => {
    if (!name.trim()) return;

    setIsSaving(true);

    try {
      const thumbnailData = await generateThumbnail(workout);
      const tagArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      const duration = calculateWorkoutDuration(workout);
      const sport = extractSportFromWorkout(workout);

      addTemplate(name.trim(), sport, workout, {
        tags: tagArray,
        difficulty: difficulty || undefined,
        duration,
        notes: notes.trim() || undefined,
        thumbnailData,
      });

      success(
        "Workout Saved",
        `"${name.trim()}" has been added to your library`,
        { duration: 3000 }
      );

      return true;
    } catch (err) {
      showError(
        "Save Failed",
        err instanceof Error ? err.message : "Failed to save workout",
        { duration: 5000 }
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return { saveWorkout, isSaving };
};
