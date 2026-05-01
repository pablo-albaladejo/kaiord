/**
 * Header row of the AutoMatchBanner — title + view-all toggle + Dismiss-all.
 */

export type AutoMatchBannerHeaderProps = {
  total: number;
  expanded: boolean;
  overflow: boolean;
  onToggleExpanded: () => void;
  onDismissAll: () => void;
};

export function AutoMatchBannerHeader({
  total,
  expanded,
  overflow,
  onToggleExpanded,
  onDismissAll,
}: AutoMatchBannerHeaderProps) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <span className="font-medium">Auto-match suggestions ({total})</span>
      <div className="flex items-center gap-2">
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
        <button
          type="button"
          onClick={onDismissAll}
          className="text-xs text-slate-600 hover:underline"
        >
          Dismiss all
        </button>
      </div>
    </div>
  );
}
