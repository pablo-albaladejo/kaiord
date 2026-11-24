/**
 * The kinds of health data: what is measured of the athlete's body. Kaiord
 * picks which Platform decides each of them (the automatic Authority), and
 * the landing and the Authority notice speak of these kinds only. Training
 * Zones also have an automatic Authority (Train2Go), but they are training
 * data, not health data, so no notice speaks of them.
 */
import type { ManagedDataType } from "@kaiord/core";

export const HEALTH_DATA_KINDS: readonly ManagedDataType[] = [
  "weight",
  "body-composition",
  "sleep",
  "hrv",
  "daily-wellness",
  "stress",
  "strain",
  "vitals",
  "heart-rate-series",
];

export const isHealthData = (dataType: ManagedDataType): boolean =>
  HEALTH_DATA_KINDS.includes(dataType);
