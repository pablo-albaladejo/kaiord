/**
 * Duration Type Select Component
 *
 * Dropdown for selecting advanced duration type.
 */

import type { AdvancedDurationType } from "./duration-type-options";
import { DURATION_TYPE_OPTIONS } from "./duration-type-options";

type DurationTypeSelectProps = {
  value: AdvancedDurationType;
  onChange: (value: AdvancedDurationType) => void;
  disabled?: boolean;
}

export function DurationTypeSelect({
  value,
  onChange,
  disabled = false,
}: DurationTypeSelectProps) {
  return (
    <div>
      <label
        htmlFor="advanced-duration-type"
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        Duration Type
      </label>
      <select
        id="advanced-duration-type"
        value={value}
        onChange={(e) => onChange(e.target.value as AdvancedDurationType)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-white"
      >
        {DURATION_TYPE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
