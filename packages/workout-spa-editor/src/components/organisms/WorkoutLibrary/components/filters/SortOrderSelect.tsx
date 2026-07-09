/**
 * SortOrderSelect Component
 *
 * Dropdown for selecting sort order (ascending/descending).
 */

import { useTranslate } from "../../../../../i18n/use-translate";

type SortOrderSelectProps = {
  value: "asc" | "desc";
  onChange: (value: "asc" | "desc") => void;
};

export function SortOrderSelect({ value, onChange }: SortOrderSelectProps) {
  const t = useTranslate("library");
  return (
    <div>
      <label
        htmlFor="sort-order-select"
        className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {t("filters.sortOrder.label")}
      </label>
      <select
        id="sort-order-select"
        value={value}
        onChange={(e) => onChange(e.target.value as "asc" | "desc")}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      >
        <option value="asc">{t("filters.sortOrder.asc")}</option>
        <option value="desc">{t("filters.sortOrder.desc")}</option>
      </select>
    </div>
  );
}
