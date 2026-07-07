/**
 * Presentation mapping for a `LabFlag` (F3.3). `in`/`low`/`high`/`unknown`
 * each get a badge label + colour classes. `unknown` (missing or unparsable
 * range) is deliberately NOT treated as out-of-range and never highlighted.
 */
import type { LabFlag } from "@kaiord/core";

export type LabFlagStyle = { label: string; className: string };

export const LAB_FLAG_STYLES: Record<LabFlag, LabFlagStyle> = {
  in: {
    label: "In range",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  low: {
    label: "Low",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  },
  high: {
    label: "High",
    className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  },
  unknown: {
    label: "No range",
    className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
};

/** Whether a flag marks a value outside its reference range (highlightable). */
export const isOutOfRange = (flag: LabFlag): boolean =>
  flag === "low" || flag === "high";
