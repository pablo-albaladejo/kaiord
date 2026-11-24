/**
 * (gate, workout state) → what the ribbon says.
 *
 * `null` means silence: nothing is broken and nothing is stale, so the
 * screen says nothing at all (principle 2). Every non-null entry names the
 * consequence, not just the fault (principle 6), and carries the action that
 * resolves the problem it just described (principle 4).
 */

import type { WorkoutState } from "../../../types/calendar-enums";
import type { GarminGate } from "./use-garmin-gate";

/** A Connection state the ribbon words through `connectionNotice`. */
export type RibbonConnection = Exclude<
  GarminGate,
  "ready" | "export-disabled" | "checking"
>;

export type RibbonContent = {
  headlineKey: string;
  detailKey: string;
  /** `attention` sits on the elevated surface — the send is one click away.
      `quiet` sits on the page: the chain is broken further out and the fix
      is on another screen. */
  tone: "attention" | "quiet";
  /** Present only when the fix is elsewhere. When it is absent the send
      button is the CTA, because nothing is in its way. */
  fixLabelKey?: string;
  connection?: undefined;
};

/** The Connection's own notice: its message is the headline, its fix the
    button, so the ribbon reads exactly like the Garmin card and popup. */
export type RibbonNotice = {
  connection: RibbonConnection;
  tone: "quiet";
};

const EXPORT_OFF: RibbonContent = {
  headlineKey: "ribbon.exportOffHeadline",
  detailKey: "ribbon.exportOffDetail",
  fixLabelKey: "ribbon.exportOffAction",
  tone: "quiet",
};

/** States where a send is the thing the person came for. `pushed` is absent
    on purpose: the watch already has this version, so the screen is silent. */
const SENDABLE: Partial<Record<WorkoutState, RibbonContent>> = {
  structured: {
    headlineKey: "ribbon.sendReady",
    detailKey: "ribbon.sendReadyDetail",
    tone: "attention",
  },
  ready: {
    headlineKey: "ribbon.sendReady",
    detailKey: "ribbon.sendReadyDetail",
    tone: "attention",
  },
  modified: {
    headlineKey: "ribbon.staleHeadline",
    detailKey: "ribbon.staleDetail",
    tone: "attention",
  },
};

/** A sent workout whose calendar placement needs the athlete's answer. */
const PLACEMENT: RibbonContent = {
  headlineKey: "ribbon.placementHeadline",
  detailKey: "ribbon.placementDetail",
  tone: "attention",
};

export function resolveRibbonContent(
  gate: GarminGate,
  state: WorkoutState,
  placementNeedsAthlete = false
): RibbonContent | RibbonNotice | null {
  const sendable =
    SENDABLE[state] ?? (placementNeedsAthlete ? PLACEMENT : undefined);
  if (!sendable) return null;
  if (gate === "ready") return sendable;
  if (gate === "export-disabled") return EXPORT_OFF;
  // Nothing is worded before the first ping answers.
  if (gate === "checking") return null;
  return { connection: gate, tone: "quiet" };
}
