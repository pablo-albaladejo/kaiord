import type { MealSlot } from "@kaiord/core";
import { useId } from "react";

const SLOTS: readonly { value: MealSlot; label: string }[] = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
] as const;

export type MealSlotFieldProps = {
  value: MealSlot | "";
  onChange: (value: MealSlot | "") => void;
};

/** Optional meal-slot selector for the intake logger ("Any" = unset). */
export function MealSlotField({ value, onChange }: MealSlotFieldProps) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex-1 text-xs font-medium text-slate-300">
      Meal
      <select
        id={id}
        value={value}
        aria-label="Meal slot"
        onChange={(event) => onChange(event.target.value as MealSlot | "")}
        className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100"
      >
        <option value="">Any</option>
        {SLOTS.map((slot) => (
          <option key={slot.value} value={slot.value}>
            {slot.label}
          </option>
        ))}
      </select>
    </label>
  );
}
