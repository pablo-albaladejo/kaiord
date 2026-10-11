/**
 * Per-metric icon for the calendar wellness badges; the accessible-label
 * prefix is `calendar:wellnessBand.<metric>`. Order here is the render order
 * in the band.
 */
import { Activity, Flame, HeartPulse, Moon, Scale } from "lucide-react";
import type { ComponentType } from "react";

import type { WellnessMetric } from "../../../../types/health/day-wellness";

export type WellnessBadgeDef = {
  metric: WellnessMetric;
  icon: ComponentType<{ className?: string }>;
};

export const WELLNESS_BADGE_DEFS: ReadonlyArray<WellnessBadgeDef> = [
  { metric: "sleep", icon: Moon },
  { metric: "hrv", icon: HeartPulse },
  { metric: "weight", icon: Scale },
  { metric: "steps", icon: Activity },
  { metric: "net", icon: Flame },
];
