/**
 * Badge-name → per-metric drill-down route for the calendar wellness
 * band. Distinct from the `FileType`-keyed `health-destination.ts`
 * import map — badge names are not KRD `FileType`s, so reusing that map
 * would hit its `?? "/health"` fallback. This map mirrors the same
 * destinations and keeps the import map single-purpose.
 */
import type { WellnessMetric } from "../../../../types/health/day-wellness";

export const WELLNESS_BADGE_ROUTES: Record<WellnessMetric, string> = {
  sleep: "/health/sleep",
  hrv: "/health/recovery",
  weight: "/health/weight",
  steps: "/health/activity",
  net: "/nutrition",
};
