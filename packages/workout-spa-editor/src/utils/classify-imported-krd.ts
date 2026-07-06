/**
 * Classify an imported KRD as an executed `activity` or a structured
 * `workout` (F0 step 0.5). The rule is explicit and testable:
 *   - `recorded_activity`, or any file carrying executed records/laps/
 *     sessions ⇒ `activity`;
 *   - `structured_workout` with no executed data ⇒ `workout`;
 *   - anything else (e.g. a course) is inconclusive ⇒ `activity` with a
 *     warning (`ambiguous: true`), so an execution is never silently
 *     dropped.
 */

import type { KRD } from "../types/krd";

export type ImportClassification = {
  kind: "activity" | "workout";
  /** True when the shape was inconclusive and defaulted to "activity". */
  ambiguous: boolean;
};

const hasExecutedData = (krd: KRD): boolean =>
  (krd.records?.length ?? 0) > 0 ||
  (krd.laps?.length ?? 0) > 0 ||
  (krd.sessions?.length ?? 0) > 0;

export const classifyImportedKrd = (krd: KRD): ImportClassification => {
  if (krd.type === "recorded_activity" || hasExecutedData(krd)) {
    return { kind: "activity", ambiguous: false };
  }
  if (krd.type === "structured_workout") {
    return { kind: "workout", ambiguous: false };
  }
  return { kind: "activity", ambiguous: true };
};
