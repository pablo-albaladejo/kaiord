/**
 * CoachingSidebar — read-only display of the coach prescription that
 * a coaching-derived workout was generated from (per design D4 / spec
 * §9). Rendered alongside the EditorPage step editor so the user can
 * read the prescription while building or refining the structured
 * workout.
 *
 * Collapses on narrow viewports; the toggle persists via
 * `useSidebarCollapse`.
 */
import { ChevronLeft, ChevronRight } from "lucide-react";

import { toCoachingActivity } from "../../../adapters/train2go/coaching-record-to-activity.converter";
import type { CoachingActivityRecord } from "../../../types/coaching-activity-record";
import { CoachingDescription } from "./CoachingDescription";
import { useSidebarCollapse } from "./use-sidebar-collapse";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  completed: "Completed",
  skipped: "Skipped",
};

export type CoachingSidebarProps = {
  activity: CoachingActivityRecord;
};

export function CoachingSidebar({ activity }: CoachingSidebarProps) {
  const { collapsed, toggle } = useSidebarCollapse();
  if (collapsed) {
    return (
      <button
        type="button"
        data-testid="coaching-sidebar-expand"
        onClick={toggle}
        className="flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <ChevronRight className="h-3 w-3" aria-hidden="true" />
        Coach
      </button>
    );
  }
  const view = toCoachingActivity(activity);
  const sport = view.sport;
  const status = STATUS_LABEL[activity.status] ?? activity.status;
  return (
    <aside
      data-testid="coaching-sidebar"
      className="space-y-3 rounded border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-900"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">{activity.title}</h2>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {sport.icon} {sport.label} · {status}
          </div>
        </div>
        <button
          type="button"
          data-testid="coaching-sidebar-collapse"
          onClick={toggle}
          aria-label="Collapse coach sidebar"
          className="rounded p-1 text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <CoachingDescription description={activity.description ?? null} />
    </aside>
  );
}
