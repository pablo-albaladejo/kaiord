/**
 * SortOrderSelect Component
 *
 * Dropdown for selecting sort order (ascending/descending).
 */

type SortOrderSelectProps = {
  value: "asc" | "desc";
  onChange: (value: "asc" | "desc") => void;
};

export function SortOrderSelect({ value, onChange }: SortOrderSelectProps) {
  return (
    <div>
      <label
        htmlFor="sort-order-select"
        className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Order
      </label>
      <select
        id="sort-order-select"
        value={value}
        onChange={(e) => onChange(e.target.value as "asc" | "desc")}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      >
        <option value="asc">Ascending</option>
        <option value="desc">Descending</option>
      </select>
    </div>
  );
}
