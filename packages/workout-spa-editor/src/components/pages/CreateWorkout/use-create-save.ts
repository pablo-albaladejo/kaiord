import { useCallback } from "react";

import type { KRD } from "../../../types/krd";
import { buildWorkoutRecord } from "./build-workout-record";
import { useSaveAndPush } from "./use-save-and-push";

export type CreateSaveArgs = {
  generatedKrd: KRD | null;
  activeProfileId: string | null;
  sport: string;
  promptText: string;
  title: string;
  dateParam: string | null;
  /** Post-save landing; receives the persisted record's calendar date. */
  onSaved: (date: string) => void;
};

/**
 * Save wiring for the AI create flow: builds the WorkoutRecord from the
 * generated KRD and hands the persisted record's date to `onSaved` so the
 * route layer can land on the matching calendar week.
 */
export function useCreateSave(args: CreateSaveArgs) {
  const { generatedKrd, activeProfileId, sport, promptText } = args;
  const { title, dateParam, onSaved } = args;

  const buildRecord = useCallback(() => {
    if (!generatedKrd) throw new Error("No generated workout to save");
    return buildWorkoutRecord({
      profileId: activeProfileId ?? "",
      sport,
      prompt: promptText,
      title,
      krd: generatedKrd,
      date: dateParam,
    });
  }, [activeProfileId, sport, promptText, title, generatedKrd, dateParam]);

  return useSaveAndPush({
    buildRecord,
    onDone: (record) => onSaved(record.date),
  });
}
