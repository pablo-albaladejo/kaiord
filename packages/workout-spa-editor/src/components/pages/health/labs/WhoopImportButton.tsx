import { useTranslation } from "react-i18next";

import { useWhoopLabImport } from "./use-whoop-lab-import";

/**
 * WHOOP lab-import button — a user-initiated (D6) pull of biomarker tests,
 * rendered only once the whoop-bridge is discovered and its session reports
 * connected. Never auto-fires.
 */
export function WhoopImportButton() {
  const { t } = useTranslation("labImport");
  const whoop = useWhoopLabImport();
  if (!whoop.canImport) return null;
  return (
    <button
      type="button"
      disabled={whoop.isRunning}
      onClick={() => void whoop.run()}
      className="self-start rounded border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-gray-600"
    >
      {whoop.isRunning ? t("whoopImporting") : t("whoopButton")}
    </button>
  );
}
