/**
 * useSaveToLibrary Hook
 *
 * Handles the logic for saving workouts to the library.
 */

import { useState } from "react";
import { useToastContext } from "../../../contexts/ToastContext";
import { useLibraryStore } from "../../../store/library-store";
import type { KRD } from "../../../types/krd";
import type { DifficultyLevel } from "../../../types/workout-library";
import { calculateWorkoutDuration } from "./calculate-duration";
import { generateThumbnail } from "./generate-thumbnail";

export function useSaveToLibrary(workout: KRD, onClose: () => void) {
  const { addTemplate } = useLibraryStore();
  const { success, error: showError } = useToastContext();

  const [name, setName] = useState("");
  const [tags, setTags] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyLevel | "">("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;

    setIsSaving(true);

    try {
      const thumbnailData = await generateThumbnail(workout);

      const tagArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const duration = calculateWorkoutDuration(workout);

      const workoutData = workout.extensions?.workout;
      const sport =
        workoutData &&
        typeof workoutData === "object" &&
        "sport" in workoutData &&
        typeof workoutData.sport === "string"
          ? workoutData.sport
          : "cycling";

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

      setName("");
      setTags("");
      setDifficulty("");
      setNotes("");
      onClose();
    } catch (err) {
      showError(
        "Save Failed",
        err instanceof Error ? err.message : "Failed to save workout",
        { duration: 5000 }
      );
    } finally {
      setIsSaving(false);
    }
  };

  return {
    name,
    setName,
    tags,
    setTags,
    difficulty,
    setDifficulty,
    notes,
    setNotes,
    isSaving,
    handleSave,
  };
}
