/**
 * PaceInput Component
 *
 * Input for pace values in mm:ss format, converting to/from total seconds.
 */

import { secondsToMmSs } from "../utils/pace-format";

type PaceInputProps = {
  label: string;
  unit: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  disabled?: boolean;
};

export function PaceInput({
  label,
  unit,
  value,
  onChange,
  disabled = false,
}: PaceInputProps) {
  const displayValue = value !== undefined ? secondsToMmSs(value) : "";

  const handleChange = (raw: string) => {
    if (!raw) {
      onChange(undefined);
      return;
    }
    const parts = raw.split(":");
    if (parts.length !== 2) return;
    const mins = parseInt(parts[0], 10);
    const secs = parseInt(parts[1], 10);
    if (isNaN(mins) || isNaN(secs)) return;
    onChange(mins * 60 + secs);
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <input
        type="text"
        aria-label={`${label} threshold`}
        value={displayValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="mm:ss"
        disabled={disabled}
        className="w-24 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:opacity-50"
      />
      <span className="text-xs text-gray-500 dark:text-gray-400">{unit}</span>
    </div>
  );
}
