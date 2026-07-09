/**
 * Header row of the AutoMatchBanner — title + view-all toggle.
 *
 * Dismiss-all is gone in the per-pair model: each row now dismisses
 * itself via Reject, and there is no notion of a banner-level expiry
 * to override.
 */

import { useTranslate } from "../../../i18n/use-translate";

export type AutoMatchBannerHeaderProps = {
  total: number;
  expanded: boolean;
  overflow: boolean;
  onToggleExpanded: () => void;
};

export function AutoMatchBannerHeader({
  total,
  expanded,
  overflow,
  onToggleExpanded,
}: AutoMatchBannerHeaderProps) {
  const t = useTranslate("coaching");
  return (
    <div className="mb-2 flex items-center justify-between">
      <span className="font-medium">{t("banner.title", { total })}</span>
      {overflow && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={onToggleExpanded}
          className="text-xs text-primary-600 hover:underline"
        >
          {expanded ? t("banner.collapse") : t("banner.viewAll", { total })}
        </button>
      )}
    </div>
  );
}
