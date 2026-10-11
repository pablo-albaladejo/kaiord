/**
 * Pure parsing/validation for the quick intake logger form. Maps the string
 * field state to a `LogIntakeEntryInput` (sans date), rejecting blank energy
 * and any negative/non-finite number. No React; unit-tested in isolation.
 */

import type { MealSlot } from "@kaiord/core";

import type { LogIntakeEntryInput } from "../../../application/nutrition/log-intake-entry.use-case";
import { getTranslate, type Translate } from "../../../i18n/use-translate";

export type IntakeLoggerFields = {
  kcal: string;
  proteinG: string;
  carbG: string;
  fatG: string;
  label: string;
  mealSlot: MealSlot | "";
};

export type IntakeLoggerEntry = Omit<LogIntakeEntryInput, "date">;

export type IntakeLoggerResult =
  { entry: IntakeLoggerEntry } | { error: string };

export const EMPTY_INTAKE_FIELDS: IntakeLoggerFields = {
  kcal: "",
  proteinG: "",
  carbG: "",
  fatG: "",
  label: "",
  mealSlot: "",
};

const toNumber = (raw: string): number => (raw.trim() === "" ? 0 : Number(raw));

const invalid = (value: number): boolean =>
  !Number.isFinite(value) || value < 0;

export const validateIntakeForm = (
  fields: IntakeLoggerFields,
  t: Translate = getTranslate("nutrition")
): IntakeLoggerResult => {
  const kcal = toNumber(fields.kcal);
  const proteinG = toNumber(fields.proteinG);
  const carbG = toNumber(fields.carbG);
  const fatG = toNumber(fields.fatG);
  if (fields.kcal.trim() === "") return { error: t("logger.errorKcal") };
  if ([kcal, proteinG, carbG, fatG].some(invalid)) {
    return { error: t("logger.errorNegative") };
  }
  const label = fields.label.trim();
  return {
    entry: {
      kcal,
      proteinG,
      carbG,
      fatG,
      label: label === "" ? undefined : label,
      mealSlot: fields.mealSlot === "" ? undefined : fields.mealSlot,
    },
  };
};

export type PresetCandidate = { entry: IntakeLoggerEntry; label: string };

/**
 * What "Save preset" would save. A valid form wins; with the number fields
 * still empty, the entry just added is kept on offer, so the preset does not
 * have to be saved before the entry is added (F-38). The label is the typed
 * one, else the entry's own; without either there is nothing to name.
 */
export const presetCandidate = (
  fields: IntakeLoggerFields,
  result: IntakeLoggerResult,
  justLogged: IntakeLoggerEntry | null
): PresetCandidate | null => {
  const numbersEmpty = [
    fields.kcal,
    fields.proteinG,
    fields.carbG,
    fields.fatG,
  ].every((raw) => raw.trim() === "");
  const entry =
    "entry" in result ? result.entry : numbersEmpty ? justLogged : null;
  const label = fields.label.trim() || entry?.label || "";
  return entry && label !== "" ? { entry: { ...entry, label }, label } : null;
};
