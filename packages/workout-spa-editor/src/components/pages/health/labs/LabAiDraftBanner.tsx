/**
 * LabAiDraftBanner — review notice shown while the entry form holds an
 * AI-extracted draft, with a control to discard it back to manual entry.
 */
import { useTranslation } from "react-i18next";

export type LabAiDraftBannerProps = {
  onDiscard: () => void;
};

export function LabAiDraftBanner({ onDiscard }: LabAiDraftBannerProps) {
  const { t } = useTranslation("labImport");

  return (
    <div
      className="flex items-center justify-between gap-2 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
      data-testid="lab-ai-draft-banner"
    >
      <span>{t("reviewBanner")}</span>
      <button
        type="button"
        onClick={onDiscard}
        className="text-sm font-medium underline"
      >
        {t("discard")}
      </button>
    </div>
  );
}
