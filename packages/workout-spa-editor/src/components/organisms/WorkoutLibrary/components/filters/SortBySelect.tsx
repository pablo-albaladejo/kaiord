/**
 * SortBySelect Component
 *
 * Dropdown for selecting sort criteria.
 */

import { useTranslate } from "../../../../../i18n/use-translate";

type SortBySelectProps = {
  value: "name" | "date" | "difficulty";
  onChange: (value: "name" | "date" | "difficulty") => void;
};

export function SortBySelect({ value, onChange }: SortBySelectProps) {
  const t = useTranslate("library");
  return (
    <div>
      <label
        htmlFor="sort-by-select"
        className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {t("filters.sortBy.label")}
      </label>
      <select
        id="sort-by-select"
        value={value}
        onChange={(e) =>
          onChange(e.target.value as "name" | "date" | "difficulty")
        }
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      >
        <option value="name">{t("filters.sortBy.name")}</option>
        <option value="date">{t("filters.sortBy.dateCreated")}</option>
        <option value="difficulty">{t("filters.sortBy.difficulty")}</option>
      </select>
    </div>
  );
}
