/**
 * Density toggle for the calendar — switches between compact (denser
 * cards, just a status icon) and comfortable (status text visible,
 * MatchedSessionCard renders both Plan and Actual rows).
 *
 * Uses the WAI-ARIA Switch pattern (role=switch, aria-checked) per APG
 * §3.27 — density is a binary on/off state, not an action toggle.
 * Icon reflects the NEXT state (the action it will perform), so the
 * visual cue and the `aria-label` "Switch to <next> view" agree.
 */

import { LayoutGrid, List } from "lucide-react";

import type { CalendarDensity } from "../../../types/user-preferences";

export type DensityToggleProps = {
  density: CalendarDensity;
  onToggle: (next: CalendarDensity) => void;
};

const nextDensity = (current: CalendarDensity): CalendarDensity =>
  current === "compact" ? "comfortable" : "compact";

export function DensityToggle({ density, onToggle }: DensityToggleProps) {
  const next = nextDensity(density);
  const label = `Switch to ${next} view`;
  const Icon = next === "compact" ? LayoutGrid : List;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={density === "compact"}
      aria-label={label}
      title={label}
      data-testid="density-toggle"
      onClick={() => onToggle(next)}
      className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
