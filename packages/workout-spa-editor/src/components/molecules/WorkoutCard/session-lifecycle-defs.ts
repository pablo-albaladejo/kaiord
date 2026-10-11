/**
 * Icon defs for the session lifecycle badge row; each facet's accessible
 * label is `calendar` key `lifecycleBadge.<facet>`.
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
};

export const LIFECYCLE_BADGE_DEFS: ReadonlyArray<LifecycleBadgeDef> = [
  { facet: "fromCoach", icon: Link2 },
  { facet: "aiAssisted", icon: Sparkles },
  { facet: "pushedToGarmin", icon: Watch },
  { facet: "executedAndMatched", icon: CircleCheck },
];
