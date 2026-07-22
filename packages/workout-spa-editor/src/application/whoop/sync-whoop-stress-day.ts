/**
 * Fetches, converts, and persists ONE calendar day of WHOOP stress for the
 * syncWhoopStress orchestrator. Split out to keep that use case's loop body
 * under the function-size cap (mirrors sync-whoop-heart-rate-day.ts's role
 * for the heart-rate-series sync). `stressBffToEpisode` returning `null`
 * (no gauge reported that day) and an already-imported day (dedup) both
 * surface as `{ status: "skipped" }` — the orchestrator counts them
 * together.
 */
import { stressBffToEpisode, whoopStressResponseSchema } from "@kaiord/whoop";

import type { ImportedRecordRepository } from "../import/imported-record-repository.port";
import { stampProvenance } from "../import/stamp-provenance";
import { upsertImportedRecord } from "../import/upsert-imported-record.use-case";
import type { WhoopFetchResult } from "./whoop-fetch-result";
import type { CalendarDay } from "./whoop-metrics-window";

const WHOOP_BRIDGE_SOURCE = "whoop-bridge";
const STRESS_BFF_PATH = "/health-service/v2/stress-bff";

export type SyncStressDayDeps = {
  importedRecords: ImportedRecordRepository;
  fetchStress: (path: string) => Promise<WhoopFetchResult>;
};

export type SyncStressDayInput = { profileId: string; userId: number };

export type StressDayOutcome =
  | { status: "imported" }
  | { status: "skipped" }
  | { status: "transport-error"; error?: string };

export const syncStressDay = async (
  deps: SyncStressDayDeps,
  input: SyncStressDayInput,
  day: CalendarDay
): Promise<StressDayOutcome> => {
  let result: WhoopFetchResult;
  try {
    result = await deps.fetchStress(`${STRESS_BFF_PATH}/${day.date}`);
  } catch (err) {
    return {
      status: "transport-error",
      error: err instanceof Error ? err.message : String(err),
    };
  }
  if (!result.ok) return { status: "transport-error", error: result.error };

  const parsed = whoopStressResponseSchema.safeParse(result.data);
  if (!parsed.success) {
    return {
      status: "transport-error",
      error: "Malformed WHOOP stress response",
    };
  }

  const episode = stressBffToEpisode(parsed.data, {
    userId: input.userId,
    date: day.date,
  });
  if (!episode) return { status: "skipped" };

  const { created } = await upsertImportedRecord(
    { recordRepo: deps.importedRecords },
    {
      profileId: input.profileId,
      dataType: "stress",
      date: day.date,
      payload: episode,
      measuredAt: episode.startTime,
      ...stampProvenance(
        WHOOP_BRIDGE_SOURCE,
        episode.externalId ?? `stress:${input.userId}:${day.date}`
      ),
    }
  );
  return created ? { status: "imported" } : { status: "skipped" };
};
