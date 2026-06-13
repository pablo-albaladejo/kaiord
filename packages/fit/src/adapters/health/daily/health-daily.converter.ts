import type { DailyWellness } from "@kaiord/core";

import { fitTimestampToIso } from "../../shared/fit-timestamp";
import type { FitMonitoring, FitMonitoringInfo } from "./fit-monitoring.schema";

const HEALTH_VERSION = "2.0";
const FULL_DAY_MIN = 1440;
const ISO_DATE_LENGTH = 10;

const toIsoDate = (
  value: FitMonitoringInfo["timestamp"] | undefined
): string | undefined => {
  if (!value) return undefined;
  return fitTimestampToIso(value).slice(0, ISO_DATE_LENGTH);
};

const sumSteps = (samples: FitMonitoring[]): number =>
  samples.reduce((sum, s) => sum + (s.steps ?? 0), 0);

const sumActiveCalories = (samples: FitMonitoring[]): number =>
  samples.reduce((sum, s) => sum + (s.activeCalories ?? 0), 0);

const pickDate = (
  info: FitMonitoringInfo | undefined,
  samples: FitMonitoring[]
): string | undefined => {
  if (info) return toIsoDate(info.timestamp);
  const firstWithTs = samples.find((s) => s.timestamp);
  return firstWithTs ? toIsoDate(firstWithTs.timestamp) : undefined;
};

/**
 * Aggregates a day's FIT `monitoring` + `monitoring_info` messages
 * into the KRD daily wellness payload. Steps and active calories are
 * summed across all monitoring messages; resting calories come from
 * `monitoring_info.restingMetabolicRate`. Intensity-minute fields
 * default to 0 because the source fixture does not emit them.
 */
export const mapFitMonitoringToKrdDaily = (
  info: FitMonitoringInfo | undefined,
  monitoring: FitMonitoring[]
): DailyWellness | undefined => {
  const date = pickDate(info, monitoring);
  if (!date) return undefined;
  return {
    kind: "daily",
    version: HEALTH_VERSION,
    date,
    steps: sumSteps(monitoring),
    activeCalories: sumActiveCalories(monitoring),
    restingCalories: info?.restingMetabolicRate ?? 0,
    intensityMinutes: { moderate: 0, vigorous: 0 },
  };
};

/**
 * Inverse mapper — KRD daily wellness → FIT monitoring_info + one
 * day-summary monitoring message. Per-sample messages cannot be
 * reconstructed from the KRD summary, so the FIT output is a
 * minimum-viable header + summary pair, not a byte-equal copy.
 */
export const mapKrdDailyToFit = (
  daily: DailyWellness
): { info: FitMonitoringInfo; summary: FitMonitoring } => {
  const timestamp = new Date(`${daily.date}T00:00:00.000Z`);
  return {
    info: { timestamp, restingMetabolicRate: daily.restingCalories },
    summary: {
      timestamp,
      steps: daily.steps,
      activeCalories: daily.activeCalories,
      durationMin: FULL_DAY_MIN,
    },
  };
};
