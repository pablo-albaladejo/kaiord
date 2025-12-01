/**
 * DifficultyFilter Component
 *
 * Dropdown filter for difficulty level.
 */

type Difficulty = "easy" | "medium" | "hard";

type DifficultyFilterProps = {
  value: Difficulty | "all";
  onChange: (value: Difficulty | "all") => void;
};

export function DifficultyFilter({ value, onChange }: DifficultyFilterProps) {
  return (
    <div>
      <label
        htmlFor="difficulty-filter-select"
        className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Difficulty
      </label>
      <select
        id="difficulty-filter-select"
        value={value}
        onChange={(e) => onChange(e.target.value as Difficulty | "all")}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      >
        <option value="all">All Levels</option>
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>
    </div>
  );
}
