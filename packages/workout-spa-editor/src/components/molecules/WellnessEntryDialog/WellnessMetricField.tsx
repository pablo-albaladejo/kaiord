/**
 * WellnessMetricField — one labeled input (number, h:mm text or clock time)
 * for a single wellness value. The `<label>` is associated to the input via `useId` so the
 * field has an accessible name (SR users hear the metric + unit).
 */
import { useId } from "react";

export type WellnessMetricFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  type?: "number" | "text" | "time";
  placeholder?: string;
  /** Marks the field the dialog focuses when opened for a metric. */
  focusKey?: string;
};

export function WellnessMetricField({
  label,
  value,
  onChange,
  unit,
  min,
  max,
  step,
  type = "number",
  placeholder,
  focusKey,
}: WellnessMetricFieldProps) {
  const inputId = useId();
  const labelText = unit ? `${label} (${unit})` : label;

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-gray-900 dark:text-white"
      >
        {labelText}
      </label>
      <input
        id={inputId}
        type={type}
        inputMode={type === "number" ? "decimal" : undefined}
        placeholder={placeholder}
        data-wellness-focus={focusKey}
        value={value}
        aria-label={labelText}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(event.target.value)}
        className="rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      />
    </div>
  );
}
