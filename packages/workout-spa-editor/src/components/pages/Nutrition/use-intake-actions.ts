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
import { useTranslate } from "../../../i18n/use-translate";
import type { IntakeLoggerEntry } from "./intake-logger-model";

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
  const t = useTranslate("nutrition");

  const logEntry = async (date: string, entry: IntakeLoggerEntry) => {
    const saved = await logIntakeEntry(
      { persistence, profileId },
      { date, ...entry }
    );
    if (saved) toast.success(t("toast.entryLogged"));
    else toast.error(t("toast.entryRejected"));
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
    if (saved) toast.success(t("toast.presetSaved"));
    else toast.error(t("toast.entryRejected"));
    return saved !== undefined;
  };

  const applyPreset = async (date: string, presetId: string) => {
    const applied = await applyPresetToDate(
      { persistence, profileId },
      { presetId, date }
    );
    if (applied) toast.success(t("toast.presetApplied"));
    else toast.error(t("toast.entryRejected"));
  };

  const deleteEntry = async (id: string) => {
    await deleteIntakeEntry({ persistence }, id);
    toast.success(t("toast.deleted"));
  };

  const removePreset = (id: string) => deleteIntakePreset({ persistence }, id);

  return { logEntry, savePreset, applyPreset, deleteEntry, removePreset };
}
