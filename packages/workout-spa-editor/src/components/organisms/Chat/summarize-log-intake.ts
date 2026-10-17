import type { MealSlot } from "@kaiord/core";

import {
  type ActionInput,
  num,
  type SummaryContext,
  text,
} from "./action-input";

const MEAL_SLOTS = new Set<string>([
  "breakfast",
  "lunch",
  "dinner",
  "snack",
] satisfies MealSlot[]);

export const summarizeLogIntake = (
  input: ActionInput,
  { t, formatDay }: SummaryContext
): string | null => {
  const date = text(input, "date");
  const kcal = num(input, "kcal");
  const protein = num(input, "proteinG");
  const carb = num(input, "carbG");
  const fat = num(input, "fatG");
  if (
    !date ||
    kcal === undefined ||
    protein === undefined ||
    carb === undefined ||
    fat === undefined
  ) {
    return null;
  }
  const line = t("summary.intake", {
    kcal,
    protein,
    carb,
    fat,
    date: formatDay(date),
  });
  const slot = text(input, "mealSlot");
  const slotted =
    slot && MEAL_SLOTS.has(slot)
      ? t("summary.intakeSlot", { slot: t(`summary.mealSlot.${slot}`), line })
      : line;
  const label = text(input, "label");
  return label
    ? t("summary.intakeLabelled", { label, line: slotted })
    : slotted;
};
