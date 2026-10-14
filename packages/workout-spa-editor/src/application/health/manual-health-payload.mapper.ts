/**
 * Pure builders for minimal valid KRD v2.0 health payloads entered by
 * hand (sleep has its own converter). Every metric derives its timestamp from the clicked `day`
 * (YYYY-MM-DD) at noon UTC, sidestepping timezone-boundary drift, except
 * today's weigh-in: it carries the real time it was taken, because the most
 * recent measurement is the current weight and several sources can weigh in
 * on the same day.
 *
 * Steps carries only the steps: the manual daily row holds what the athlete
 * entered, never zero-filled calories or intensity.
 */
import type { HrvSummary, WeightMeasurement } from "@kaiord/core";

import type { StoredDailyWellness } from "../../types/health/stored-daily-wellness";
import { todayIsoDate } from "../../utils/today-iso-date";

const KRD_VERSION = "2.0";

const noonOf = (day: string): string => `${day}T12:00:00.000Z`;

export const buildWeightPayload = (
  weightKilograms: number,
  day: string
): WeightMeasurement => ({
  kind: "weight",
  version: KRD_VERSION,
  measuredAt: day === todayIsoDate() ? new Date().toISOString() : noonOf(day),
  weightKilograms,
});

export const buildHrvPayload = (rMSSD: number, day: string): HrvSummary => ({
  kind: "hrv",
  version: KRD_VERSION,
  measuredAt: noonOf(day),
  rMSSD,
  measurementWindow: "spot",
});

export const buildStepsPayload = (
  steps: number,
  day: string
): StoredDailyWellness => ({
  kind: "daily",
  version: KRD_VERSION,
  date: day,
  steps,
});
