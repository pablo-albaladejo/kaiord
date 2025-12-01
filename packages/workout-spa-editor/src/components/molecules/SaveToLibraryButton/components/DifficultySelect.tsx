/**
 * DifficultySelect Component
 *
 * Select dropdown for workout difficulty level.
 */

import type { DifficultyLevel } from "../../../../types/workout-library";

type DifficultySelectProps = {
  value: DifficultyLevel | "";
  onChange: (value: DifficultyLevel | "") => void;
  disabled?: boolean;
};

export function DifficultySelect({
  value,
  onChange,
  disabled,
}: DifficultySelectProps) {
  return (
    <div>
      <label
        htmlFor="workout-difficulty"
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        Difficulty
      </label>
      <select
        id="workout-difficulty"
        value={value}
        onChange={(e) => onChange(e.target.value as DifficultyLevel | "")}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        disabled={disabled}
      >
        <option value="">Select difficulty</option>
        <option value="easy">Easy</option>
        <option value="moderate">Moderate</option>
        <option value="hard">Hard</option>
        <option value="very_hard">Very Hard</option>
      </select>
    </div>
  );
}
