/**
 * Per-metric icon and accessible-label prefix for the calendar wellness
 * badges. Order here is the render order in the band.
 */
import { Activity, Flame, HeartPulse, Moon, Scale } from "lucide-react";
import type { ComponentType } from "react";

import type { WellnessMetric } from "../../../../types/health/day-wellness";

export type WellnessBadgeDef = {
  metric: WellnessMetric;
  icon: ComponentType<{ className?: string }>;
  label: string;
};

export const WELLNESS_BADGE_DEFS: ReadonlyArray<WellnessBadgeDef> = [
  { metric: "sleep", icon: Moon, label: "Sleep" },
  { metric: "hrv", icon: HeartPulse, label: "HRV" },
  { metric: "weight", icon: Scale, label: "Weight" },
  { metric: "steps", icon: Activity, label: "Steps" },
  { metric: "net", icon: Flame, label: "Net" },
];
