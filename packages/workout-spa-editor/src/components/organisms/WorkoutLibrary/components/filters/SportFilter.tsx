/**
 * SportFilter Component
 *
 * Dropdown filter for sport type.
 */

type Sport = "cycling" | "running" | "swimming" | "generic";

type SportFilterProps = {
  value: Sport | "all";
  onChange: (value: Sport | "all") => void;
};

export function SportFilter({ value, onChange }: SportFilterProps) {
  return (
    <div>
      <label
        htmlFor="sport-filter-select"
        className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Sport
      </label>
      <select
        id="sport-filter-select"
        value={value}
        onChange={(e) => onChange(e.target.value as Sport | "all")}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      >
        <option value="all">All Sports</option>
        <option value="cycling">Cycling</option>
        <option value="running">Running</option>
        <option value="swimming">Swimming</option>
        <option value="generic">Generic</option>
      </select>
    </div>
  );
}
