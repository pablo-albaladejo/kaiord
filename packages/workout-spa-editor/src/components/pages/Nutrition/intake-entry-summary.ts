/**
 * Pure display formatters for a logged intake entry / preset. These produce
 * the in-page text only (never toast or console arguments).
 */
import type { MealSlot } from "@kaiord/core";

const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

export const mealSlotLabel = (slot: MealSlot | undefined): string | null =>
  slot ? SLOT_LABEL[slot] : null;

export type MacroLine = {
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
};

export const macroSummary = (line: MacroLine): string =>
  `${Math.round(line.kcal)} kcal · ${Math.round(line.proteinG)}P ` +
  `${Math.round(line.carbG)}C ${Math.round(line.fatG)}F`;
