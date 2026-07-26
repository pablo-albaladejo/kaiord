/**
 * Readiness view-model derivation for the Today page.
 *
 * Inputs are Garmin daily metrics persisted under the health stores: the
 * overnight HRV summary (`rMSSD` + optional 0..100 `score`), the sleep
 * session (`score` + duration), and the day's stress episodes. The Battery
 * stat is a daily-energy proxy derived from stress (100 − mean stress level),
 * an independent signal — not the HRV score. No values are invented: every
 * metric resolves to a string or the em-dash placeholder when its record is
 * absent.
 */
import type { HrvSummary, SleepRecord, StressEpisode } from "@kaiord/core";

import { getTranslate, type Translate } from "../../../i18n/use-translate";
import {
  batteryValue,
  compositeScore,
  EM_DASH,
  hrvTrend,
  SCORE_MAX,
  sleepValue,
} from "./readiness-metrics";

function readyHeadline(
  ready: boolean,
  isFocusToday: boolean,
  t: Translate
): string {
  if (ready)
    return t(
      isFocusToday ? "readiness.headlinePushToday" : "readiness.headlinePush"
    );
  return t(
    isFocusToday ? "readiness.headlineEasyToday" : "readiness.headlineEasy"
  );
}

export type ReadinessMetric = {
  label: string;
  value: string;
  trend?: string;
  /** F3.2/F3.3: which source the resolver picked for this metric, and
      whether it had to fall back past the preferred source. Undefined
      for metrics the resolver doesn't govern yet (battery/stress). */
  source?: string;
  usedFallback?: boolean;
};

export type ReadinessModel = {
  score: number | null;
  headline: string;
  rationale: string;
  hrv: ReadinessMetric;
  sleep: ReadinessMetric;
  battery: ReadinessMetric;
};

export type ReadinessMetricSource = {
  sourceBridgeId: string | undefined;
  usedFallback: boolean;
};

export function buildReadinessModel(
  hrv: HrvSummary | undefined,
  sleep: SleepRecord | undefined,
  stress: StressEpisode[] | undefined,
  isFocusToday: boolean,
  hrvSource?: ReadinessMetricSource,
  sleepSource?: ReadinessMetricSource,
  t: Translate = getTranslate("daily")
): ReadinessModel {
  const score = compositeScore(hrv, sleep);
  const ready = score !== null && score >= SCORE_MAX / 2;
  return {
    score,
    headline:
      score === null
        ? t("readiness.noDataYet")
        : readyHeadline(ready, isFocusToday, t),
    rationale:
      score === null
        ? t("readiness.rationaleNoData")
        : t("readiness.rationale"),
    hrv: {
      label: t("readiness.hrv"),
      value: hrv ? `${Math.round(hrv.rMSSD)}` : EM_DASH,
      trend: hrvTrend(hrv),
      source: hrvSource?.sourceBridgeId,
      usedFallback: hrvSource?.usedFallback,
    },
    sleep: {
      label: t("readiness.sleep"),
      value: sleepValue(sleep),
      source: sleepSource?.sourceBridgeId,
      usedFallback: sleepSource?.usedFallback,
    },
    battery: { label: t("readiness.battery"), value: batteryValue(stress) },
  };
}
