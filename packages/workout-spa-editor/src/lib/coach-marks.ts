/**
 * Pure model behind the anchored coach marks.
 *
 * A coach mark replaces a tutorial step: instead of a centred dialog shown in
 * a fixed order, it fires only when the action it teaches is actually
 * available, and only while it can be attached to a real element.
 *
 * `anchors` maps each mark to the `FocusRegistry` item id it would point at.
 * A `null` anchor disqualifies the mark outright — a coach mark that cannot
 * point at anything is a centred dialog again, which is what this replaces.
 */

import type { Align, Side } from "../components/atoms/Tooltip/compute-position";

/** Also an `EditorCommand` id, so the mark reuses that command's guard and run. */
export type CoachMarkId = "create-block" | "ungroup-block";

export type CoachMarkDef = {
  readonly id: CoachMarkId;
  readonly side: Side;
  readonly align: Align;
};

/** Evaluated in order; the first eligible mark wins, so at most one shows. */
export const COACH_MARKS: ReadonlyArray<CoachMarkDef> = [
  { id: "create-block", side: "right", align: "start" },
  { id: "ungroup-block", side: "right", align: "start" },
];

export type CoachMarkSignals = {
  /** Ids of the editor commands whose guard is currently open. */
  readonly available: ReadonlyArray<string>;
  /** Registry item id each mark anchors to; `null` means "not anchorable". */
  readonly anchors: Readonly<Record<CoachMarkId, string | null>>;
  /** Mark ids the profile already acted on or waved away. */
  readonly dismissed: ReadonlyArray<string>;
};

export type ActiveCoachMark = CoachMarkDef & { readonly anchorId: string };

export const pickCoachMark = (
  signals: CoachMarkSignals
): ActiveCoachMark | null => {
  for (const def of COACH_MARKS) {
    if (signals.dismissed.includes(def.id)) continue;
    if (!signals.available.includes(def.id)) continue;
    const anchorId = signals.anchors[def.id];
    if (!anchorId) continue;
    return { ...def, anchorId };
  }
  return null;
};
