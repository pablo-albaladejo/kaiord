/**
 * WorkoutCard Utilities
 *
 * State indicator mapping and sport icon resolution.
 */

import type { WorkoutState } from "../../../types/calendar-enums";

export type StateIndicator = {
  label: string;
  symbol: string;
  className: string;
};

const STATE_INDICATORS: Record<WorkoutState, StateIndicator> = {
  stale: { label: "Stale", symbol: "!", className: "text-orange-500" },
  modified: { label: "Modified", symbol: "~", className: "text-blue-500" },
  raw: { label: "Raw", symbol: "\u26A0\uFE0F", className: "text-yellow-500" },
  structured: {
    label: "Structured",
    symbol: "\u25CB",
    className: "text-gray-500",
  },
  ready: { label: "Ready", symbol: "\u2605", className: "text-green-500" },
  pushed: { label: "Pushed", symbol: "\u2713", className: "text-green-600" },
  skipped: { label: "Skipped", symbol: "\u2014", className: "text-gray-400" },
};

export function getStateIndicator(state: WorkoutState): StateIndicator {
  return STATE_INDICATORS[state];
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
