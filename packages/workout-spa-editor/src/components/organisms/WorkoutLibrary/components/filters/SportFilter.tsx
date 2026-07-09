/**
 * SportFilter Component
 *
 * Dropdown filter for sport type.
 */

import { useTranslate } from "../../../../../i18n/use-translate";

type Sport = "cycling" | "running" | "swimming" | "generic";

type SportFilterProps = {
  value: Sport | "all";
  onChange: (value: Sport | "all") => void;
};

export function SportFilter({ value, onChange }: SportFilterProps) {
  const t = useTranslate("library");
  return (
    <div>
      <label
        htmlFor="sport-filter-select"
        className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {t("filters.sport.label")}
      </label>
      <select
        id="sport-filter-select"
        value={value}
        onChange={(e) => onChange(e.target.value as Sport | "all")}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      >
        <option value="all">{t("filters.sport.all")}</option>
        <option value="cycling">{t("filters.sport.cycling")}</option>
        <option value="running">{t("filters.sport.running")}</option>
        <option value="swimming">{t("filters.sport.swimming")}</option>
        <option value="generic">{t("filters.sport.generic")}</option>
      </select>
    </div>
  );
}
