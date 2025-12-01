/**
 * SubSportSelect Component
 *
 * Sub-sport selection dropdown.
 */

import type { Sport, SubSport } from "../../../../types/krd";
import { SUB_SPORTS } from "../constants";

type SubSportSelectProps = {
  sport: Sport;
  value: SubSport;
  onChange: (subSport: SubSport) => void;
};

export function SubSportSelect({
  sport,
  value,
  onChange,
}: SubSportSelectProps) {
  return (
    <div>
      <label
        htmlFor="workout-sub-sport"
        className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Sub-Sport
      </label>
      <select
        id="workout-sub-sport"
        value={value}
        onChange={(e) => onChange(e.target.value as SubSport)}
        aria-label="Sub-sport type"
        data-testid="workout-sub-sport-select"
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      >
        {SUB_SPORTS[sport].map((ss) => (
          <option key={ss} value={ss}>
            {ss.replace(/_/g, " ").charAt(0).toUpperCase() +
              ss.replace(/_/g, " ").slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}
