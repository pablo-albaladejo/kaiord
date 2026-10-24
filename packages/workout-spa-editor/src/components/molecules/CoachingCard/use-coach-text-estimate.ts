import { useMemo } from "react";

import {
  type EstimatedSegment,
  estimateZoneProfile,
} from "../../../application/coaching/estimate-zone-profile";

/** The zone profile estimated from a coach's text, recomputed per text. */
export function useCoachTextEstimate(
  text: string | undefined
): EstimatedSegment[] {
  return useMemo(() => (text ? estimateZoneProfile(text) : []), [text]);
}
