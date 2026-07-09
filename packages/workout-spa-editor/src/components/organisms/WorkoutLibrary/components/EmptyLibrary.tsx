/**
 * Empty Library Component
 *
 * Displays when the workout library is empty or no results found.
 */

import { BookOpen } from "lucide-react";

import { useTranslate } from "../../../../i18n/use-translate";
import { Button } from "../../../atoms/Button";

type EmptyLibraryProps = {
  isFiltered: boolean;
  onClearFilters?: () => void;
};

export function EmptyLibrary({
  isFiltered,
  onClearFilters,
}: EmptyLibraryProps) {
  const t = useTranslate("library");
  if (isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BookOpen className="mb-4 h-12 w-12 text-gray-400" />
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
          {t("empty.filteredTitle")}
        </h3>
        <p className="mb-4 text-gray-600 dark:text-gray-400">
          {t("empty.filteredMessage")}
        </p>
        {onClearFilters && (
          <Button variant="secondary" onClick={onClearFilters}>
            {t("filters.clearFilters")}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <BookOpen className="mb-4 h-12 w-12 text-gray-400" />
      <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
        {t("empty.title")}
      </h3>
      <p className="mb-4 text-gray-600 dark:text-gray-400">
        {t("empty.createMessage")}
      </p>
    </div>
  );
}
