/**
 * Duration Value Input Component
 *
 * Input field for duration value with dynamic label and step.
 */

import type { AdvancedDurationType } from "./duration-type-options";

type DurationValueInputProps = {
  durationType: AdvancedDurationType;
  value: string;
  label: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function DurationValueInput({
  durationType,
  value,
  label,
  onChange,
  disabled = false,
}: DurationValueInputProps) {
  const step =
    durationType === "calories" ||
    durationType === "repeat_until_calories" ||
    durationType.includes("heart_rate")
      ? "1"
      : "0.1";

  return (
    <div>
      <label
        htmlFor="advanced-duration-value"
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        {label}
      </label>
      <input
        id="advanced-duration-value"
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        min="0"
        step={step}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-white"
      />
    </div>
  );
}
