/**
 * saveManualHealthMetric — application use case for a hand-entered
 * wellness value from the calendar add-entry chooser.
 *
 * Finds the day's existing MANUAL record for the metric via the metric's
 * own Dexie table (range query for [day, day]) and reuses its id, else
 * mints a fresh id — the find-then-reuse upsert that keeps exactly one
 * manual record per day per metric on AWAITED saves. Another source's row
 * of the day is never reused; the read policy chooses between sources. A
 * manual steps row holds only the steps, except a legacy one (an imported
 * row an older save re-stamped `manual`): it keeps its measured values.
 * The read+put run inside `persistence.transaction(...)`; this alone is
 * NOT concurrency-safe, so the form-submit lock closes the un-awaited race.
 *
 * Writes are stamped `sourceBridgeId: "manual"` with an `externalId`
 * hashed from metric+day, and do NOT go through the insert-or-ignore
 * `upsertImportedRecord`, which would turn a value edit into a no-op.
 */
import { canonicalHash } from "@kaiord/core";

import type { HealthRecord } from "../../ports/health-record-repository";
import type { PersistencePort } from "../../ports/persistence-port";
import {
  MANUAL_SOURCE_BRIDGE_ID,
  stampProvenance,
} from "../import/stamp-provenance";
import type { ManualHealthMetric } from "./manual-health-metric";
import { repoForMetric, schemaForMetric } from "./manual-health-metric";
import {
  buildHrvPayload,
  buildWeightPayload,
} from "./manual-health-payload.mapper";
import {
  buildSleepPayload,
  type ManualSleepEntry,
} from "./manual-sleep-payload.converter";
import { buildManualStepsPayload } from "./manual-steps-row";

export type SaveManualHealthMetricDeps = {
  persistence: PersistencePort;
  profileId: string;
  newId?: () => string;
};

export type SaveManualHealthMetricInput =
  | { metric: Exclude<ManualHealthMetric, "sleep">; day: string; value: number }
  | { metric: "sleep"; day: string; sleep: ManualSleepEntry };

export type SaveManualHealthMetricResult = { recordId: string };

const buildPayload = (
  input: SaveManualHealthMetricInput,
  own: HealthRecord<unknown> | undefined
): unknown => {
  switch (input.metric) {
    case "weight":
      return buildWeightPayload(input.value, input.day);
    case "sleep":
      return buildSleepPayload(input.sleep, input.day);
    case "hrv":
      return buildHrvPayload(input.value, input.day);
    case "daily-wellness":
      return buildManualStepsPayload(input.value, input.day, own);
  }
};

export const saveManualHealthMetric = async (
  deps: SaveManualHealthMetricDeps,
  input: SaveManualHealthMetricInput
): Promise<SaveManualHealthMetricResult | undefined> => {
  if ("value" in input && !Number.isFinite(input.value)) return undefined;
  const { persistence, profileId } = deps;
  const repo = repoForMetric(persistence, input.metric);
  return persistence.transaction(async () => {
    const rows = await repo.getByProfileAndDateRange(
      profileId,
      input.day,
      input.day
    );
    const own = rows.find((r) => r.sourceBridgeId === MANUAL_SOURCE_BRIDGE_ID);
    const id = own?.id ?? deps.newId?.() ?? crypto.randomUUID();
    const krd = buildPayload(input, own);
    const parsed = schemaForMetric(input.metric).safeParse(krd);
    if (!parsed.success) return undefined;
    const provenance = stampProvenance(
      MANUAL_SOURCE_BRIDGE_ID,
      canonicalHash({ metric: input.metric, day: input.day })
    );
    await repo.put({
      id,
      profileId,
      date: input.day,
      krd: parsed.data,
      ...provenance,
    });
    return { recordId: id };
  });
};
