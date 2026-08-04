/**
 * LabAiDraftBanner — review notice shown while the entry form holds an
 * AI-extracted draft, with a control to discard it back to manual entry.
 *
 * A draft awaiting review needs the user, so it says so with the alert glyph
 * and the sentence, on the elevated surface — the palette has no warning role
 * and amber is zone 4's hue.
 */
import { useTranslation } from "react-i18next";

import { ALERT_ICON, Icon } from "../../../atoms/Icon";

export type LabAiDraftBannerProps = {
  onDiscard: () => void;
};

export function LabAiDraftBanner({ onDiscard }: LabAiDraftBannerProps) {
  const { t } = useTranslation("labImport");

  return (
    <div
      className="flex items-center justify-between gap-3 rounded-2xl border border-edge bg-surface-elevated px-4 py-3 text-sm text-ink-strong"
      data-testid="lab-ai-draft-banner"
    >
      <span className="flex items-center gap-2">
        <Icon icon={ALERT_ICON} size="sm" color="inherit" />
        {t("reviewBanner")}
      </span>
      <button
        type="button"
        onClick={onDiscard}
        className="shrink-0 text-sm font-medium text-ink-body underline transition-colors hover:text-ink-strong"
      >
        {t("discard")}
      </button>
    </div>
  );
}
