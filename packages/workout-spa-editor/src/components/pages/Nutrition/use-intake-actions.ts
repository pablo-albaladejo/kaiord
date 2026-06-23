/**
 * use-intake-actions — bridges the Nutrition surfaces to the Phase-3 intake
 * use cases (log entry, save/apply/delete preset, delete entry). Each action
 * surfaces a PII-safe static toast and never interpolates a user-entered
 * value (R-PIIInterpolation).
 */
import { applyPresetToDate } from "../../../application/nutrition/apply-preset-to-date.use-case";
import { deleteIntakeEntry } from "../../../application/nutrition/delete-intake-entry.use-case";
import { deleteIntakePreset } from "../../../application/nutrition/delete-intake-preset.use-case";
import { logIntakeEntry } from "../../../application/nutrition/log-intake-entry.use-case";
import { saveIntakePreset } from "../../../application/nutrition/save-intake-preset.use-case";
import { usePersistence } from "../../../contexts/persistence-context";
import { useToastContext } from "../../../contexts/ToastContext";
import type { IntakeLoggerEntry } from "./intake-logger-model";

const TOAST_ENTRY_LOGGED = "Entry logged";
const TOAST_ENTRY_REJECTED = "Could not log entry — check the values";
const TOAST_PRESET_SAVED = "Preset saved";
const TOAST_PRESET_APPLIED = "Preset applied";
const TOAST_DELETED = "Entry removed";

export type UseIntakeActionsResult = {
  logEntry: (date: string, entry: IntakeLoggerEntry) => Promise<boolean>;
  savePreset: (entry: IntakeLoggerEntry, label: string) => Promise<boolean>;
  applyPreset: (date: string, presetId: string) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  removePreset: (id: string) => Promise<void>;
};

export function useIntakeActions(profileId: string): UseIntakeActionsResult {
  const persistence = usePersistence();
  const toast = useToastContext();

  const logEntry = async (date: string, entry: IntakeLoggerEntry) => {
    const saved = await logIntakeEntry(
      { persistence, profileId },
      { date, ...entry }
    );
    if (saved) toast.success(TOAST_ENTRY_LOGGED);
    else toast.error(TOAST_ENTRY_REJECTED);
    return saved !== undefined;
  };

  const savePreset = async (entry: IntakeLoggerEntry, label: string) => {
    const saved = await saveIntakePreset(
      { persistence, profileId },
      {
        label,
        kcal: entry.kcal,
        proteinG: entry.proteinG,
        carbG: entry.carbG,
        fatG: entry.fatG,
        defaultMealSlot: entry.mealSlot,
      }
    );
    if (saved) toast.success(TOAST_PRESET_SAVED);
    else toast.error(TOAST_ENTRY_REJECTED);
    return saved !== undefined;
  };

  const applyPreset = async (date: string, presetId: string) => {
    const applied = await applyPresetToDate(
      { persistence, profileId },
      { presetId, date }
    );
    if (applied) toast.success(TOAST_PRESET_APPLIED);
    else toast.error(TOAST_ENTRY_REJECTED);
  };

  const deleteEntry = async (id: string) => {
    await deleteIntakeEntry({ persistence }, id);
    toast.success(TOAST_DELETED);
  };

  const removePreset = (id: string) => deleteIntakePreset({ persistence }, id);

  return { logEntry, savePreset, applyPreset, deleteEntry, removePreset };
}
