/**
 * useSaveToLibrary Hook
 *
 * Persists the current workout as a template via the `addTemplate`
 * application use case. Rejections surface through the toast context
 * so the user sees a clear error indication instead of a silent
 * stale-success state.
 */

import { useState } from "react";

import { addTemplate } from "../../../application/library/add-template";
import { usePersistence } from "../../../contexts/persistence-context";
import { useToastContext } from "../../../contexts/ToastContext";
import type { KRD } from "../../../types/krd";
import type { DifficultyLevel } from "../../../types/workout-library";
import { calculateWorkoutDuration } from "./calculate-duration";
import { generateThumbnail } from "./generate-thumbnail";

function extractSportFromWorkout(workout: KRD): string {
  const workoutData = workout.extensions?.structured_workout;
  return workoutData &&
    typeof workoutData === "object" &&
    "sport" in workoutData &&
    typeof workoutData.sport === "string"
    ? workoutData.sport
    : "cycling";
}

function parseTags(tagsString: string): string[] {
  return tagsString
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

export function useSaveToLibrary(workout: KRD, onClose: () => void) {
  const persistence = usePersistence();
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
      const tagArray = parseTags(tags);
      const duration = calculateWorkoutDuration(workout);
      const sport = extractSportFromWorkout(workout);

      await addTemplate(persistence, name.trim(), sport, workout, {
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
