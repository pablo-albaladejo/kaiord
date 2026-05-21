/**
 * Calendar view toggle — switches between the week Grid view and the
 * vertical List view.
 *
 * Uses the WAI-ARIA Switch pattern (role=switch, aria-checked) per APG
 * §3.27 — view is a binary on/off state, not an action toggle.
 * Icon reflects the NEXT state (the action it will perform), so the
 * visual cue and the `aria-label` "Switch to <next> view" agree.
 */

import { LayoutGrid, List } from "lucide-react";

import type { CalendarView } from "../../../types/user-preferences";

export type CalendarViewToggleProps = {
  view: CalendarView;
  /**
   * Allowed to return a Promise (e.g. when wired through
   * useSetCalendarView, which awaits a Dexie write). The component
   * swallows rejection because view-write failures (concurrent
   * profile-delete, infrastructure error) are non-fatal — the
   * underlying live-query keeps the UI consistent.
   */
  onToggle: (next: CalendarView) => void | Promise<void>;
};

const nextView = (current: CalendarView): CalendarView =>
  current === "grid" ? "list" : "grid";

export function CalendarViewToggle({
  view,
  onToggle,
}: CalendarViewToggleProps) {
  const next = nextView(view);
  const label = `Switch to ${next} view`;
  const Icon = next === "grid" ? LayoutGrid : List;
  const handleClick = () => {
    // View-write failure is non-fatal whether it surfaces synchronously
    // (sync throw from a misbehaving consumer) or asynchronously (Dexie
    // rejection). The live-query observation in the consumer keeps the
    // persisted state truthful and the UI consistent on the next render.
    try {
      const result = onToggle(next);
      if (result && typeof result.then === "function") {
        result.catch(() => {});
      }
    } catch {
      // swallow sync throw — same rationale as the async path.
    }
  };
  return (
    <button
      type="button"
      role="switch"
      aria-checked={view === "grid"}
      aria-label={label}
      title={label}
      data-testid="calendar-view-toggle"
      onClick={handleClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
