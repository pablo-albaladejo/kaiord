import type { HrvSummary } from "@kaiord/core";

import { fitTimestampToIso } from "../../shared/fit-timestamp";
import type { FitHrvStatusSummary, FitHrvValue } from "./fit-hrv.schema";

const HEALTH_VERSION = "2.0";

/**
 * Builds the KRD HRV summary from FIT messages.
 *
 * Preference order: if an `hrv_status_summary` is present, use its
 * `lastNightAverage` as the RMSSD and mark window="overnight"; else
 * use the first `hrv_value` sample with window="spot". Returns
 * `undefined` if neither carries a usable RMSSD.
 */
export const mapFitHrvToKrd = (
  summary: FitHrvStatusSummary | undefined,
  firstValue: FitHrvValue | undefined
): HrvSummary | undefined => {
  if (summary && summary.lastNightAverage !== undefined) {
    return {
      kind: "hrv",
      version: HEALTH_VERSION,
      measuredAt: fitTimestampToIso(summary.timestamp),
      rMSSD: summary.lastNightAverage,
      measurementWindow: "overnight",
    };
  }
  if (firstValue) {
    return {
      kind: "hrv",
      version: HEALTH_VERSION,
      measuredAt: fitTimestampToIso(firstValue.timestamp),
      rMSSD: firstValue.value,
      measurementWindow: "spot",
    };
  }
  return undefined;
};

/**
 * Inverse mapper — KRD HRV summary → FIT `hrv_status_summary` shape.
 * The output `lastNightAverage` carries the RMSSD; baselines and the
 * status enum default to `"balanced"` (KRD does not model them).
 */
export const mapKrdHrvToFit = (hrv: HrvSummary): FitHrvStatusSummary => ({
  timestamp: new Date(hrv.measuredAt),
  lastNightAverage: hrv.rMSSD,
  status: "balanced",
});
