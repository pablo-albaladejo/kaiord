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
};

const GATE_CONTENT: Record<Exclude<GarminGate, "ready">, RibbonContent> = {
  "no-extension": {
    headlineKey: "ribbon.noBridgeHeadline",
    detailKey: "ribbon.noBridgeDetail",
    fixLabelKey: "ribbon.noBridgeAction",
    tone: "quiet",
  },
  "export-disabled": {
    headlineKey: "ribbon.exportOffHeadline",
    detailKey: "ribbon.exportOffDetail",
    fixLabelKey: "ribbon.exportOffAction",
    tone: "quiet",
  },
  "no-session": {
    headlineKey: "ribbon.noSessionHeadline",
    detailKey: "ribbon.noSessionDetail",
    fixLabelKey: "ribbon.noSessionAction",
    tone: "attention",
  },
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

export function resolveRibbonContent(
  gate: GarminGate,
  state: WorkoutState
): RibbonContent | null {
  const sendable = SENDABLE[state];
  if (!sendable) return null;
  if (gate === "ready") return sendable;
  return GATE_CONTENT[gate];
}
