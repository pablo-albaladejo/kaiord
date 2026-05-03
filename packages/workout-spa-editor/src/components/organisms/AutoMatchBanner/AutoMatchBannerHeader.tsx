/**
 * Header row of the AutoMatchBanner — title + view-all toggle.
 *
 * Dismiss-all is gone in the per-pair model: each row now dismisses
 * itself via Reject, and there is no notion of a banner-level expiry
 * to override.
 */

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
  return (
    <div className="mb-2 flex items-center justify-between">
      <span className="font-medium">Auto-match suggestions ({total})</span>
      {overflow && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={onToggleExpanded}
          className="text-xs text-primary-600 hover:underline"
        >
          {expanded ? "Collapse" : `view all (${total})`}
        </button>
      )}
    </div>
  );
}
