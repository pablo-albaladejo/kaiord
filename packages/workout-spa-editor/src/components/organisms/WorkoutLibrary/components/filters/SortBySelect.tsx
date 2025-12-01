/**
 * SortBySelect Component
 *
 * Dropdown for selecting sort criteria.
 */

type SortBySelectProps = {
  value: "name" | "date" | "difficulty";
  onChange: (value: "name" | "date" | "difficulty") => void;
};

export function SortBySelect({ value, onChange }: SortBySelectProps) {
  return (
    <div>
      <label
        htmlFor="sort-by-select"
        className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Sort By
      </label>
      <select
        id="sort-by-select"
        value={value}
        onChange={(e) =>
          onChange(e.target.value as "name" | "date" | "difficulty")
        }
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      >
        <option value="name">Name</option>
        <option value="date">Date Created</option>
        <option value="difficulty">Difficulty</option>
      </select>
    </div>
  );
}
