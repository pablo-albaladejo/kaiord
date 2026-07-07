/**
 * Visual mapping for each Data Hub cell state (F4.1): the short badge label,
 * its Tailwind classes, and whether the cell is an actionable toggle. Only
 * `active`/`available` are actionable — every other state is informational
 * (the flow is blocked until a real precondition changes).
 */
import type { DataHubCellState } from "../../../application/data-hub/build-data-hub-matrix";

export type CellVisual = {
  label: string;
  className: string;
  actionable: boolean;
};

export const CELL_VISUALS: Record<DataHubCellState, CellVisual> = {
  active: {
    label: "On",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    actionable: true,
  },
  available: {
    label: "Off",
    className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
    actionable: true,
  },
  "not-operational": {
    label: "Offline",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    actionable: false,
  },
  "not-connected": {
    label: "Connect",
    className:
      "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
    actionable: false,
  },
  aspirational: {
    label: "Soon",
    className: "bg-transparent text-gray-400 dark:text-gray-600",
    actionable: false,
  },
  manual: {
    label: "Manual",
    className:
      "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    actionable: false,
  },
  na: { label: "", className: "", actionable: false },
};
