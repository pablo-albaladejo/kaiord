/**
 * saveManualHealthMetric — application use case for a hand-entered
 * wellness value from the calendar add-entry chooser.
 *
 * Finds the day's existing record for the metric via the metric's own
 * Dexie table (range query for [day, day]) and reuses `rows[0]?.id`,
 * else mints a fresh id — the find-then-reuse upsert that keeps exactly
 * one record per day per metric on AWAITED saves. The read+put run
 * inside `persistence.transaction(...)`; note this alone is NOT
 * concurrency-safe (the in-memory transaction has no mutual exclusion),
 * so the form-submit lock in Phase 2 closes the un-awaited race.
 */
import type { DailyWellness } from "@kaiord/core";

import type { HealthRecord } from "../../ports/health-record-repository";
import type { PersistencePort } from "../../ports/persistence-port";
import type { ManualHealthMetric } from "./manual-health-metric";
import { repoForMetric, schemaForMetric } from "./manual-health-metric";
import {
  buildHrvPayload,
  buildSleepPayload,
  buildStepsPayload,
  buildWeightPayload,
} from "./manual-health-payload.mapper";

export type SaveManualHealthMetricDeps = {
  persistence: PersistencePort;
  profileId: string;
  newId?: () => string;
};

export type SaveManualHealthMetricInput = {
  metric: ManualHealthMetric;
  day: string;
  value: number;
};

export type SaveManualHealthMetricResult = { recordId: string };

const buildPayload = (
  metric: ManualHealthMetric,
  value: number,
  day: string,
  prior: HealthRecord<unknown> | undefined
): unknown => {
  switch (metric) {
    case "weight":
      return buildWeightPayload(value, day);
    case "sleep":
      return buildSleepPayload(value, day);
    case "hrv":
      return buildHrvPayload(value, day);
    case "steps":
      return buildStepsPayload(value, day, prior?.krd as DailyWellness);
  }
};

export const saveManualHealthMetric = async (
  deps: SaveManualHealthMetricDeps,
  input: SaveManualHealthMetricInput
): Promise<SaveManualHealthMetricResult | undefined> => {
  // Defensive guard: a non-finite value is a no-op (no write).
  if (!Number.isFinite(input.value)) return undefined;
  const { persistence, profileId } = deps;
  const repo = repoForMetric(persistence, input.metric);
  return persistence.transaction(async () => {
    // No `krd.kind` filter — the metric's table already isolates it.
    const rows = await repo.getByProfileAndDateRange(
      profileId,
      input.day,
      input.day
    );
    const id = rows[0]?.id ?? deps.newId?.() ?? crypto.randomUUID();
    const krd = buildPayload(input.metric, input.value, input.day, rows[0]);
    const parsed = schemaForMetric(input.metric).safeParse(krd);
    if (!parsed.success) return undefined;
    await repo.put({ id, profileId, date: input.day, krd: parsed.data });
    return { recordId: id };
  });
};
