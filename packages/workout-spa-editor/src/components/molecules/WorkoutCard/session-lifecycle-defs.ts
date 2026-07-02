/**
 * Icon + accessible-label defs for the session lifecycle badge row.
 * Distinct icon shapes (not colour alone) carry the meaning, per the
 * same WCAG 1.4.1 convention as `CardShell/status-tokens`. Order here
 * is the render order.
 */
import type { LucideIcon } from "lucide-react";
import { CircleCheck, Link2, Sparkles, Watch } from "lucide-react";

import type { SessionLifecycleFlags } from "./session-lifecycle";

export type LifecycleFacet = keyof SessionLifecycleFlags;

export type LifecycleBadgeDef = {
  facet: LifecycleFacet;
  icon: LucideIcon;
  label: string;
};

export const LIFECYCLE_BADGE_DEFS: ReadonlyArray<LifecycleBadgeDef> = [
  { facet: "fromCoach", icon: Link2, label: "From coach plan" },
  { facet: "aiAssisted", icon: Sparkles, label: "AI-assisted" },
  { facet: "pushedToGarmin", icon: Watch, label: "Pushed to Garmin" },
  {
    facet: "executedAndMatched",
    icon: CircleCheck,
    label: "Executed & matched",
  },
];
