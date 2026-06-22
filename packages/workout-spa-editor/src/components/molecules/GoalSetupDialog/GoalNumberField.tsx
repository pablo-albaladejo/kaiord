/**
 * GoalNumberField — one labeled number/date input for the goal form. The label
 * is associated to the input via `useId` for an accessible name.
 */
import { useId } from "react";

const FIELD_CLASS =
  "mt-1 block w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white";

export type GoalNumberFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "number" | "date";
};

export function GoalNumberField({
  label,
  value,
  onChange,
  type = "number",
}: GoalNumberFieldProps) {
  const id = useId();
  return (
    <label htmlFor={id} className="text-sm font-medium">
      {label}
      <input
        id={id}
        type={type}
        inputMode={type === "number" ? "decimal" : undefined}
        value={value}
        min={type === "number" ? 0.1 : undefined}
        step={type === "number" ? 0.1 : undefined}
        aria-label={label}
        onChange={(event) => onChange(event.target.value)}
        className={FIELD_CLASS}
      />
    </label>
  );
}
