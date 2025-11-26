/**
 * Repeat From Input Component
 *
 * Input field for repeat-from step index.
 */

interface RepeatFromInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function RepeatFromInput({
  value,
  onChange,
  disabled = false,
}: RepeatFromInputProps) {
  return (
    <div>
      <label
        htmlFor="advanced-duration-repeat-from"
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        Repeat From Step
      </label>
      <input
        id="advanced-duration-repeat-from"
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        min="0"
        step="1"
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-white"
      />
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Step index to repeat from (0 for beginning)
      </p>
    </div>
  );
}
