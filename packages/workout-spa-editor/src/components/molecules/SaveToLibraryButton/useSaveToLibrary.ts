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
import { useTranslate } from "../../../i18n/use-translate";
import type { KRD } from "../../../types/krd";
import type { DifficultyLevel } from "../../../types/workout-library";
import {
  buildAddTemplateOptions,
  extractSportFromWorkout,
} from "./save-to-library-helpers";

export function useSaveToLibrary(workout: KRD, onClose: () => void) {
  const persistence = usePersistence();
  const { success, error: showError } = useToastContext();
  const t = useTranslate("library");

  const [name, setName] = useState("");
  const [tags, setTags] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyLevel | "">("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setName("");
    setTags("");
    setDifficulty("");
    setNotes("");
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setIsSaving(true);
    try {
      const options = await buildAddTemplateOptions(workout, {
        tags,
        difficulty,
        notes,
      });
      const sport = extractSportFromWorkout(workout);

      await addTemplate(persistence, trimmedName, sport, workout, options);

      success(
        t("toast.workoutSaved"),
        t("toast.workoutSavedDescription", { name: trimmedName }),
        { duration: 3000 }
      );

      resetForm();
      onClose();
    } catch (err) {
      showError(
        t("toast.saveFailed"),
        err instanceof Error ? err.message : t("toast.saveFailedDescription"),
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
