/**
 * wellness-import-action — "Import a file" entry into the existing FIT
 * health-import flow.
 *
 * The imported record is dated by the FIT file, NOT the clicked day:
 * the import path ignores `?date=` (use-import-on-load.ts:42-54). So
 * this action navigates to `/workout/new?action=import` with NO
 * `&date=` — the file's own date drives persistence + Hub navigation.
 */
import { useLocation } from "wouter";

import { useTranslate } from "../../../i18n/use-translate";
import { withOrigin } from "../../../routing/with-origin";

export function WellnessImportAction() {
  const [, navigate] = useLocation();
  const t = useTranslate("health");

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() =>
          navigate(withOrigin("/workout/new?action=import", "daily"))
        }
        className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 dark:border-gray-600 dark:text-white"
      >
        {t("wellnessEntry.importFile")}
      </button>
      <p className="text-xs text-muted-foreground">
        {t("wellnessEntry.importHint")}
      </p>
    </div>
  );
}
