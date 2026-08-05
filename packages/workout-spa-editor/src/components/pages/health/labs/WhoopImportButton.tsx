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
      className="self-start rounded-lg border border-edge px-3 py-1.5 text-sm font-medium text-ink-body transition-colors hover:border-edge-strong hover:text-ink-strong disabled:opacity-50"
    >
      {whoop.isRunning ? t("whoopImporting") : t("whoopButton")}
    </button>
  );
}
