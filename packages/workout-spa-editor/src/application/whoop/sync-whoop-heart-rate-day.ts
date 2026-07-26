/**
 * Fetches, converts, and persists ONE calendar day of WHOOP heart-rate-series
 * for the syncWhoopHeartRate orchestrator. Split out to keep that use case's
 * loop body under the 40-LOC function cap (mirrors persist-whoop-cycle-
 * records.ts's role for the cycles sync). `metricsToHeartRateSeries`
 * returning `null` (no samples that day) and an already-imported day
 * (dedup) both surface as `{ status: "skipped" }` — the orchestrator counts
 * them together.
 */
import {
  metricsToHeartRateSeries,
  whoopMetricsResponseSchema,
} from "@kaiord/whoop";

import type { ImportedRecordRepository } from "../import/imported-record-repository.port";
import { stampProvenance } from "../import/stamp-provenance";
import { upsertImportedRecord } from "../import/upsert-imported-record.use-case";
import type { WhoopFetchResult } from "./whoop-fetch-result";
import type { CalendarDay } from "./whoop-metrics-window";
import { buildMetricsPath } from "./whoop-metrics-window";

const WHOOP_BRIDGE_SOURCE = "whoop-bridge";

export type SyncHeartRateDayDeps = {
  importedRecords: ImportedRecordRepository;
  fetchMetrics: (path: string) => Promise<WhoopFetchResult>;
};

export type SyncHeartRateDayInput = { profileId: string; userId: number };

export type HeartRateDayOutcome =
  | { status: "imported" }
  | { status: "skipped" }
  | { status: "transport-error"; error?: string };

export const syncHeartRateDay = async (
  deps: SyncHeartRateDayDeps,
  input: SyncHeartRateDayInput,
  day: CalendarDay,
  stepSeconds: number
): Promise<HeartRateDayOutcome> => {
  let result: WhoopFetchResult;
  try {
    result = await deps.fetchMetrics(
      buildMetricsPath(input.userId, day, stepSeconds)
    );
  } catch (err) {
    return {
      status: "transport-error",
      error: err instanceof Error ? err.message : String(err),
    };
  }
  if (!result.ok) return { status: "transport-error", error: result.error };

  const parsed = whoopMetricsResponseSchema.safeParse(result.data);
  if (!parsed.success) {
    return {
      status: "transport-error",
      error: "Malformed WHOOP metrics response",
    };
  }

  const series = metricsToHeartRateSeries(parsed.data, {
    userId: input.userId,
    date: day.date,
    stepSeconds,
  });
  if (!series) return { status: "skipped" };

  const { created } = await upsertImportedRecord(
    { recordRepo: deps.importedRecords },
    {
      profileId: input.profileId,
      dataType: "heart-rate-series",
      date: day.date,
      payload: series,
      measuredAt: series.startTime,
      ...stampProvenance(
        WHOOP_BRIDGE_SOURCE,
        series.externalId ?? `hr:${input.userId}:${day.date}`
      ),
    }
  );
  return created ? { status: "imported" } : { status: "skipped" };
};
