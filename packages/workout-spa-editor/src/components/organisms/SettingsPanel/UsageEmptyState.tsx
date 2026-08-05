/**
 * UsageTab empty state — shown when no usage events fall inside
 * the month-window.
 */

import { useTranslate } from "../../../i18n/use-translate";

export type UsageEmptyStateProps = {
  monthsWindow: number;
};

export function UsageEmptyState({ monthsWindow }: UsageEmptyStateProps) {
  const t = useTranslate("settings");
  return (
    <div className="space-y-3 text-sm text-ink-body">
      <h3 className="text-base font-semibold text-ink-strong">
        {t("usage.title")}
      </h3>
      <p>{t("usage.empty", { count: monthsWindow })}</p>
    </div>
  );
}
