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
  /**
   * Allowed to return a Promise (e.g. when wired through
   * useSetCalendarDensity, which awaits a Dexie write). The component
   * swallows rejection because density-write failures (concurrent
   * profile-delete, infrastructure error) are non-fatal — the
   * underlying live-query keeps the UI consistent.
   */
  onToggle: (next: CalendarDensity) => void | Promise<void>;
};

const nextDensity = (current: CalendarDensity): CalendarDensity =>
  current === "compact" ? "comfortable" : "compact";

export function DensityToggle({ density, onToggle }: DensityToggleProps) {
  const next = nextDensity(density);
  const label = `Switch to ${next} view`;
  const Icon = next === "compact" ? LayoutGrid : List;
  const handleClick = () => {
    const result = onToggle(next);
    if (result && typeof result.then === "function") {
      result.catch(() => {
        // Density-write failure is non-fatal — the live-query
        // observation in the consumer leaves the persisted state
        // truthful and the UI stays consistent on the next render.
      });
    }
  };
  return (
    <button
      type="button"
      role="switch"
      aria-checked={density === "compact"}
      aria-label={label}
      title={label}
      data-testid="density-toggle"
      onClick={handleClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
