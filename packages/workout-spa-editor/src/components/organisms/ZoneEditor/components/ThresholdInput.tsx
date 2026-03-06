/**
 * ThresholdInput Component
 *
 * Number input with unit label for threshold values.
 */

type ThresholdInputProps = {
  label: string;
  unit: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  disabled?: boolean;
};

export function ThresholdInput({
  label,
  unit,
  value,
  onChange,
  disabled = false,
}: ThresholdInputProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <input
        type="number"
        aria-label={`${label} threshold`}
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value ? Number(e.target.value) : undefined)
        }
        disabled={disabled}
        className="w-24 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:opacity-50"
      />
      <span className="text-xs text-gray-500 dark:text-gray-400">{unit}</span>
    </div>
  );
}
