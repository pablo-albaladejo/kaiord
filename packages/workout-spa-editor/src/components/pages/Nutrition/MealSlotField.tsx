import type { MealSlot } from "@kaiord/core";
import { useId } from "react";

import { useTranslate } from "../../../i18n/use-translate";

const SLOTS: readonly MealSlot[] = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
] as const;

export type MealSlotFieldProps = {
  value: MealSlot | "";
  onChange: (value: MealSlot | "") => void;
};

/** Optional meal-slot selector for the intake logger ("Any" = unset). */
export function MealSlotField({ value, onChange }: MealSlotFieldProps) {
  const id = useId();
  const t = useTranslate("nutrition");
  return (
    <label htmlFor={id} className="flex-1 text-xs font-medium text-ink-body">
      {t("logger.meal")}
      <select
        id={id}
        value={value}
        aria-label={t("logger.mealSlot")}
        onChange={(event) => onChange(event.target.value as MealSlot | "")}
        className="mt-1 block w-full rounded border border-edge bg-surface-deep px-2 py-1.5 text-sm text-ink-strong"
      >
        <option value="">{t("logger.slotAny")}</option>
        {SLOTS.map((slot) => (
          <option key={slot} value={slot}>
            {t(`logger.slots.${slot}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
