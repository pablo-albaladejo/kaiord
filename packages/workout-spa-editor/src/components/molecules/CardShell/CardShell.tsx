/**
 * CardShell — shared visual primitive for every calendar card variant.
 *
 * Owns the lateral border (4px graphical accent, ≥ 3:1 against white per
 * WCAG 1.4.11) and the metadata row layout (`flex flex-wrap min-w-0` so
 * no element overflows the card horizontally).
 *
 * Title slot uses `line-clamp-2` — never `truncate` — so the most
 * important field on the card never gets reduced to an ellipsis.
 */

import type { MouseEventHandler, ReactNode } from "react";

export type CardShellProps = {
  borderClass: string;
  ariaLabel?: string;
  tooltip?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  testId?: string;
  titleRow: ReactNode;
  metadataRow: ReactNode;
  /** Optional second row (e.g., MatchedSessionCard's actual data row). */
  secondaryRow?: ReactNode;
  /** Optional footer block — used to render block-level subgroups like
   *  MatchedSessionCard's executed-activity list. Renders raw (no wrapper). */
  footerRow?: ReactNode;
  /** Origin chip text rendered at the bottom-right (`· T2G`, `· TP`). */
  originChip?: string;
};

export function CardShell({
  borderClass,
  ariaLabel,
  tooltip,
  onClick,
  testId,
  titleRow,
  metadataRow,
  secondaryRow,
  footerRow,
  originChip,
}: CardShellProps) {
  return (
    <button
      type="button"
      data-testid={testId}
      aria-label={ariaLabel}
      title={tooltip}
      className={`block w-full rounded-md border border-slate-200 bg-white p-2 text-left text-sm shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800 motion-safe:transition-shadow border-l-4 ${borderClass}`}
      onClick={onClick}
    >
      <div className="flex min-w-0 items-start gap-1.5 line-clamp-2 font-medium">
        {titleRow}
      </div>
      <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
        {metadataRow}
      </div>
      {secondaryRow ? (
        <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          {secondaryRow}
        </div>
      ) : null}
      {footerRow}
      {originChip ? (
        <div className="mt-1 text-[10px] text-slate-500">· {originChip}</div>
      ) : null}
    </button>
  );
}
