/**
 * Pure display formatters for a logged intake entry / preset. These produce
 * the in-page text only (never toast or console arguments).
 */
import type { MealSlot } from "@kaiord/core";

import { getTranslate, type Translate } from "../../../i18n/use-translate";

export const mealSlotLabel = (
  slot: MealSlot | undefined,
  t: Translate = getTranslate("nutrition")
): string | null => (slot ? t(`logger.slots.${slot}`) : null);

export type MacroLine = {
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
};

export const macroSummary = (
  line: MacroLine,
  t: Translate = getTranslate("nutrition")
): string =>
  t("intake.macroSummary", {
    kcal: Math.round(line.kcal),
    protein: Math.round(line.proteinG),
    carb: Math.round(line.carbG),
    fat: Math.round(line.fatG),
  });
