/**
 * Visual tokens for status and compliance: colour-coded lateral border
 * (the secondary, non-conformant signal channel) plus icon (the WCAG
 * 1.4.1 conformant channel) so colour-blind users get full information.
 *
 * Border-colour tokens are chosen to achieve ≥ 3:1 contrast against a
 * white card body per WCAG 1.4.11 (verified by the contrast test).
 */

import { Check, Clock, type LucideIcon, Minus } from "lucide-react";

import type { ComplianceBucket } from "../../../application/compliance-bucket";
import type { WorkoutState } from "../../../types/calendar-enums";
import type { CoachingActivityStatus } from "../../../types/coaching-activity-record";

export const statusToColourClass = (status: CoachingActivityStatus): string => {
  switch (status) {
    case "pending":
      return "border-amber-600";
    case "completed":
      return "border-emerald-600";
    case "skipped":
      return "border-slate-500";
  }
};

export type StatusIcon = {
  Component: LucideIcon;
  label: string;
};

export const statusToIcon = (status: CoachingActivityStatus): StatusIcon => {
  switch (status) {
    case "pending":
      return { Component: Clock, label: "Pending" };
    case "completed":
      return { Component: Check, label: "Completed" };
    case "skipped":
      return { Component: Minus, label: "Skipped" };
  }
};

/**
 * Workout-state → border colour. Maps the existing 7-state workflow onto
 * the same 3-channel palette as coaching status so cards across variants
 * read consistently. STALE / MODIFIED / RAW collapse to amber (attention
 * needed); STRUCTURED / SKIPPED to neutral slate; READY / PUSHED to
 * emerald (done).
 */
export const workoutStateToColourClass = (state: WorkoutState): string => {
  switch (state) {
    case "stale":
    case "modified":
    case "raw":
      return "border-amber-600";
    case "structured":
    case "skipped":
      return "border-slate-500";
    case "ready":
    case "pushed":
      return "border-emerald-600";
  }
};

export const complianceBucketToBorderClass = (
  bucket: ComplianceBucket
): string => {
  switch (bucket) {
    case "neutral":
      // slate-500 (NOT slate-400, which fails WCAG 1.4.11 ≥ 3:1 against
      // a white card body — see contrast.test.ts). Disambiguates from
      // skipped via the card's status icon, not via colour alone.
      return "border-slate-500";
    case "amber":
      return "border-amber-600";
    case "mid":
      // Match the shared CardShell border-l-4 width; only the border-image
      // gradient distinguishes this bucket from the solid-colour ones.
      return "border-l-4 border-l-amber-600 [border-image:linear-gradient(to_bottom,theme(colors.amber.600),theme(colors.emerald.600))_1]";
    case "emerald":
      return "border-emerald-600";
  }
};
