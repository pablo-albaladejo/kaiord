/**
 * CardShell — shared visual primitive for every calendar card variant.
 *
 * The card's own border is neutral on all four sides; only the 4 px left edge
 * takes a colour, and that colour is the session's dominant training zone (see
 * `status-tokens`). Painting the whole outline with the accent — which is what
 * a bare `border-<colour>` following `border-<neutral>` did — spent the card's
 * border on a signal the left edge already carries.
 *
 * The title span inside `titleRow` carries `line-clamp-2` — never `truncate`,
 * and never this row: `line-clamp-2` sets `display:-webkit-box`, which
 * collides with this row's `display:flex`. Only one survives the cascade —
 * when both rode this div, `flex` won and the clamp was silently inert, so
 * titles grew unbounded while the class promised two lines.
 *
 * Hover moves the border colour rather than a shadow: one named property at
 * `--dur-state`, never `all`.
 */

import type { MouseEventHandler, ReactNode } from "react";

export type CardShellProps = {
  /** Left-edge colour class, from `zoneBorderClass`. */
  borderClass: string;
  ariaLabel?: string;
  tooltip?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  testId?: string;
  titleRow: ReactNode;
  /** Zone-profile bar, rendered directly under the title row. */
  zoneBar?: ReactNode;
  metadataRow: ReactNode;
  /** Optional second row (e.g., MatchedSessionCard's actual data row). */
  secondaryRow?: ReactNode;
  /** Optional footer block — used to render block-level subgroups like
   *  MatchedSessionCard's executed-activity list. Renders raw (no wrapper). */
  footerRow?: ReactNode;
  /** Origin chip text rendered at the bottom-right (`· T2G`, `· TP`). */
  originChip?: string;
};

const SHELL = [
  "block w-full rounded-xl border border-edge-soft border-l-4 bg-surface",
  // Hover strengthens three sides only: `hover:border-edge-strong` would set
  // all four border colors at :hover specificity and wipe the `border-l-zone-*`
  // edge — the dominant-zone signal this shell exists to carry.
  "p-2.5 text-left text-sm hover:border-t-edge-strong",
  "hover:border-r-edge-strong hover:border-b-edge-strong",
  "motion-safe:transition-colors motion-safe:duration-[--dur-state]",
].join(" ");

const META_ROW =
  "flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-muted";

export function CardShell({
  borderClass,
  ariaLabel,
  tooltip,
  onClick,
  testId,
  titleRow,
  zoneBar,
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
      className={`${SHELL} ${borderClass}`}
      onClick={onClick}
    >
      <div className="flex min-w-0 items-start gap-1.5 font-medium text-ink-strong">
        {titleRow}
      </div>
      {zoneBar ? <div className="mt-1.5">{zoneBar}</div> : null}
      <div className={`mt-1.5 ${META_ROW}`}>{metadataRow}</div>
      {secondaryRow ? (
        <div className={`mt-0.5 ${META_ROW}`}>{secondaryRow}</div>
      ) : null}
      {footerRow}
      {originChip ? (
        <div className="mt-1 text-[10px] text-ink-muted">· {originChip}</div>
      ) : null}
    </button>
  );
}
