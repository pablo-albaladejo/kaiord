/**
 * Pure parsing/validation for the quick intake logger form. Maps the string
 * field state to a `LogIntakeEntryInput` (sans date), rejecting blank energy
 * and any negative/non-finite number. No React; unit-tested in isolation.
 */

import type { MealSlot } from "@kaiord/core";

import type { LogIntakeEntryInput } from "../../../application/nutrition/log-intake-entry.use-case";

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
  fields: IntakeLoggerFields
): IntakeLoggerResult => {
  const kcal = toNumber(fields.kcal);
  const proteinG = toNumber(fields.proteinG);
  const carbG = toNumber(fields.carbG);
  const fatG = toNumber(fields.fatG);
  if (fields.kcal.trim() === "") return { error: "Enter the energy in kcal" };
  if ([kcal, proteinG, carbG, fatG].some(invalid)) {
    return { error: "Values must be zero or greater" };
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
