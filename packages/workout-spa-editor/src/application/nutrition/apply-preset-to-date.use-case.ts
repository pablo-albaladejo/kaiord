/**
 * applyPresetToDate — creates an intake entry for a date from a saved preset
 * in one action, copying the preset's energy + macros, its `label`, and its
 * `defaultMealSlot`. Returns the new entry, or `undefined` when the preset is
 * missing or the derived entry fails validation.
 */
import type { PersistencePort } from "../../ports/persistence-port";
import type { IntakeEntryRecord } from "../../types/intake-entry-record";
import { logIntakeEntry } from "./log-intake-entry.use-case";

export type ApplyPresetToDateDeps = {
  persistence: PersistencePort;
  profileId: string;
  newId?: () => string;
  now?: () => string;
};

export type ApplyPresetToDateInput = {
  presetId: string;
  date: string;
};

export const applyPresetToDate = async (
  deps: ApplyPresetToDateDeps,
  input: ApplyPresetToDateInput
): Promise<IntakeEntryRecord | undefined> => {
  const presets = await deps.persistence.intakePresets.getByProfile(
    deps.profileId
  );
  const preset = presets.find((p) => p.id === input.presetId);
  if (!preset) return undefined;
  return logIntakeEntry(deps, {
    date: input.date,
    kcal: preset.kcal,
    proteinG: preset.proteinG,
    carbG: preset.carbG,
    fatG: preset.fatG,
    label: preset.label,
    mealSlot: preset.defaultMealSlot,
  });
};
