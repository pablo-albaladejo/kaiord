/**
 * Per-day wellness band rendered above the training cards in a calendar
 * day cell. Muted/neutral palette (distinct from the brand-coloured
 * training cards) separated by a divider, with one compact `icon value`
 * badge per present metric.
 *
 * Renders nothing when `wellness` is undefined — which covers both the
 * loading transition (`wellnessByDay` undefined) and an absent day key
 * (no wellness that day), since callers pass `wellnessByDay?.[date]`.
 *
 * The band sits outside the drag-bound `renderDayCards` subtree and
 * never calls the drag `bind()`; its badges are links, so a pointerdown
 * navigates rather than starting a drag, and a drop onto the band still
 * resolves to the day via `closest("[data-day]")` on the cell root.
 */
import type { DayWellness } from "../../../../types/health/day-wellness";
import { WELLNESS_BADGE_DEFS } from "./wellness-badge-defs";
import { WellnessBadge } from "./WellnessBadge";

export type WellnessBandProps = {
  wellness: DayWellness | undefined;
};

export function WellnessBand({ wellness }: WellnessBandProps) {
  if (!wellness) return null;
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
