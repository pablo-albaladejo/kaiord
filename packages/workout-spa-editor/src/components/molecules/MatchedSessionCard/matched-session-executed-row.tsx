/**
 * Executed-slot row renderer for `MatchedSessionCard`. Renders one
 * compact row per executed activity (e.g., Garmin/FIT recording) that
 * was auto-linked to the same `(profileId, date, canonical sport)` slot
 * as the prescribed+structured pair.
 *
 * Renders as plain `<div>`/`<span>` elements — the parent `CardShell`
 * is a `<button>`, so interactive children (anchors, list items) are
 * forbidden by HTML semantics. Clicks on the card open the dialog via
 * the parent button's `onClick`.
 */

import type { WorkoutRecord } from "../../../types/calendar-record";
import { formatDuration } from "../WorkoutCard/workout-card-utils";

const titleOf = (w: WorkoutRecord): string => w.raw?.title ?? w.sport;
const durationText = (w: WorkoutRecord): string =>
  w.raw?.duration ? formatDuration(w.raw.duration.value) : "—";

export type ExecutedRowsProps = {
  executed: readonly WorkoutRecord[];
};

export function ExecutedRows({ executed }: ExecutedRowsProps) {
  if (executed.length === 0) return null;
  return (
    <div
      data-testid="matched-card-executed-group"
      className="mt-1 border-t border-slate-200 pt-1 dark:border-slate-700"
    >
      <div className="flex items-center gap-1 text-[10px] text-ink-muted">
        <span>Executed</span>
        {executed.length > 1 ? (
          <span
            data-testid="matched-card-executed-count"
            className="rounded-full bg-slate-200 px-1 text-[9px] text-slate-700 dark:bg-slate-700 dark:text-slate-200"
          >
            {executed.length}
          </span>
        ) : null}
      </div>
      <div className="mt-0.5 flex min-w-0 flex-col gap-0.5">
        {executed.map((w) => (
          <div
            key={w.id}
            data-testid={`matched-card-executed-${w.id}`}
            className="flex min-w-0 items-center gap-1 text-xs"
          >
            <span className="min-w-0 flex-1 truncate">{titleOf(w)}</span>
            <span className="text-[10px] text-ink-muted">
              {durationText(w)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
