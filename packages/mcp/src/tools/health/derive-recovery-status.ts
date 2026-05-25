import type { HrvSummary, SleepRecord } from "@kaiord/core";

export type RecoveryStatus = "ready" | "moderate" | "fatigued" | "unknown";

export type RecoveryResult = {
  status: RecoveryStatus;
  reason: string;
};

const REASON_UNKNOWN = "No HRV or sleep data available";
const REASON_READY = "High HRV and high sleep score";
const REASON_FATIGUED = "Low HRV or low sleep score";
const REASON_MODERATE = "Mixed or middle-range HRV and sleep signals";

const HRV_HIGH = 50;
const HRV_LOW = 30;
const SLEEP_HIGH = 75;
const SLEEP_LOW = 50;

const isReady = (hrv?: number, score?: number): boolean =>
  hrv !== undefined &&
  score !== undefined &&
  hrv > HRV_HIGH &&
  score >= SLEEP_HIGH;

const isFatigued = (hrv?: number, score?: number): boolean => {
  const hrvFatigued = hrv !== undefined && hrv < HRV_LOW;
  const sleepFatigued = score !== undefined && score < SLEEP_LOW;
  return hrvFatigued || sleepFatigued;
};

/**
 * Derives a categorical recovery status from the latest HRV and sleep
 * payloads. Returns "unknown" if neither input is available.
 */
export const deriveRecoveryStatus = (
  latestHrv?: HrvSummary,
  latestSleep?: SleepRecord
): RecoveryResult => {
  if (!latestHrv && !latestSleep) {
    return { status: "unknown", reason: REASON_UNKNOWN };
  }
  const hrv = latestHrv?.rMSSD;
  const score = latestSleep?.score;
  if (isReady(hrv, score)) return { status: "ready", reason: REASON_READY };
  if (isFatigued(hrv, score)) {
    return { status: "fatigued", reason: REASON_FATIGUED };
  }
  return { status: "moderate", reason: REASON_MODERATE };
};
