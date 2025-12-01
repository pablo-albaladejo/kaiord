/**
 * SportSelect Component
 *
 * Sport selection dropdown.
 */

import type { Sport } from "../../../../types/krd";
import { SPORTS } from "../constants";

type SportSelectProps = {
  value: Sport;
  onChange: (sport: Sport) => void;
};

export function SportSelect({ value, onChange }: SportSelectProps) {
  return (
    <div>
      <label
        htmlFor="workout-sport"
        className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Sport
      </label>
      <select
        id="workout-sport"
        value={value}
        onChange={(e) => onChange(e.target.value as Sport)}
        aria-label="Sport type"
        data-testid="workout-sport-select"
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      >
        {SPORTS.map((s) => (
          <option key={s} value={s}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}
