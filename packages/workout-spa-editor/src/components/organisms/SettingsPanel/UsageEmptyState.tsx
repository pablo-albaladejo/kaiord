/**
 * UsageTab empty state — shown when no UsageRecord rows fall inside
 * the month-window.
 */

import { useTranslate } from "../../../i18n/use-translate";

export type UsageEmptyStateProps = {
  monthsWindow: number;
};

export function UsageEmptyState({ monthsWindow }: UsageEmptyStateProps) {
  const t = useTranslate("settings");
  return (
    <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
        {t("usage.title")}
      </h3>
      <p>{t("usage.empty", { count: monthsWindow })}</p>
    </div>
  );
}
