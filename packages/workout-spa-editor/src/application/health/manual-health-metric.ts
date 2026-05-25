/**
 * Manual health metric — the four metrics a user can enter by hand from
 * the calendar add-entry chooser, plus a selector mapping each metric to
 * its own Dexie-backed repository.
 *
 * Each metric lives in a SEPARATE health store (persistence-port.ts),
 * so selecting the repo by metric is enough to isolate it — no `krd.kind`
 * filter is needed when reading back the day's existing record.
 */
import {
  dailyWellnessSchema,
  hrvSummarySchema,
  sleepRecordSchema,
  weightMeasurementSchema,
} from "@kaiord/core";
import type { z } from "zod";

import type {
  HealthRecord,
  HealthRecordRepository,
} from "../../ports/health-record-repository";
import type { PersistencePort } from "../../ports/persistence-port";

export type ManualHealthMetric = "weight" | "sleep" | "hrv" | "steps";

export type ManualMetricRepo = HealthRecordRepository<HealthRecord<unknown>>;

export const repoForMetric = (
  persistence: PersistencePort,
  metric: ManualHealthMetric
): ManualMetricRepo => {
  const byMetric: Record<ManualHealthMetric, ManualMetricRepo> = {
    weight: persistence.healthWeight as ManualMetricRepo,
    sleep: persistence.healthSleep as ManualMetricRepo,
    hrv: persistence.healthHrv as ManualMetricRepo,
    steps: persistence.healthDaily as ManualMetricRepo,
  };
  return byMetric[metric];
};

export const schemaForMetric = (
  metric: ManualHealthMetric
): z.ZodType<unknown> => {
  const byMetric: Record<ManualHealthMetric, z.ZodType<unknown>> = {
    weight: weightMeasurementSchema,
    sleep: sleepRecordSchema,
    hrv: hrvSummarySchema,
    steps: dailyWellnessSchema,
  };
  return byMetric[metric];
};
