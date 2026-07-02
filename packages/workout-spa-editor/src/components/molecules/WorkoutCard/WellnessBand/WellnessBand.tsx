/**
 * Per-day wellness/readiness band rendered above the training cards in a
 * calendar day cell. Muted/neutral palette (distinct from the
 * brand-coloured training cards) separated by a divider, with one
 * compact `icon value` badge per present metric.
 *
 * Renders nothing while the week's wellness is still loading (`resolved`
 * false — the default, so existing callers that don't pass it keep the
 * old behaviour). Once the week query has resolved, an absent day key
 * renders an explicit muted "no data" marker instead of nothing, so a
 * disconnected health source reads as honest absence rather than a
 * silent gap (per the calendario-cockpit UI-honesty principle) — no
 * value is ever invented.
 *
 * The band sits outside the drag-bound `renderDayCards` subtree and
 * never calls the drag `bind()`; its badges are links, so a pointerdown
 * navigates rather than starting a drag, and a drop onto the band still
 * resolves to the day via `closest("[data-day]")` on the cell root.
 */
import { Minus } from "lucide-react";

import type { DayWellness } from "../../../../types/health/day-wellness";
import { WELLNESS_BADGE_DEFS } from "./wellness-badge-defs";
import { WellnessBadge } from "./WellnessBadge";

export type WellnessBandProps = {
  wellness: DayWellness | undefined;
  /** Whether the week-level wellness query has resolved (not mid-flight). */
  resolved?: boolean;
};

const EMPTY_CLASS =
  "mb-1.5 flex items-center gap-1 border-b border-gray-200 pb-1.5 text-gray-400 dark:border-slate-700 dark:text-gray-500";

export function WellnessBand({
  wellness,
  resolved = false,
}: WellnessBandProps) {
  if (!wellness) {
    if (!resolved) return null;
    return (
      <div data-testid="wellness-band-empty" className={EMPTY_CLASS}>
        <Minus
          className="h-3 w-3 shrink-0"
          role="img"
          aria-label="No readiness data"
        />
      </div>
    );
  }
  return (
    <div
      data-testid="wellness-band"
      className="mb-1.5 flex flex-wrap gap-1 border-b border-gray-200 pb-1.5 dark:border-slate-700"
    >
      {WELLNESS_BADGE_DEFS.map((def) => {
        const value = wellness[def.metric];
        return value === undefined ? null : (
          <WellnessBadge key={def.metric} def={def} value={value} />
        );
      })}
    </div>
  );
}
