/**
 * syncWhoopCycles — governed import of WHOOP recovery→HRV and sleep→sleep for
 * a bounded date window (Wave 1, D9).
 *
 * Gates each data type on the import policy resolver BEFORE fetching: with no
 * enabled `hrv←whoop-bridge` / `sleep←whoop-bridge` route the pull never
 * touches the bridge and persists nothing. The window is chunked to the BFF's
 * ~200-day cap; each record is converted via `@kaiord/whoop` and upserted by
 * its stable `(sourceBridgeId, externalId)` identity through the shared
 * inbound path. Pure application layer: the bridge read is injected.
 */
import { whoopCyclesResponseSchema } from "@kaiord/whoop";

import type { ImportedRecordRepository } from "../import/imported-record-repository.port";
import type { IntegrationPolicyRepository } from "../integration-policy/integration-policy-repository.port";
import {
  persistWhoopCycleRecords,
  type WhoopPersistCounts,
} from "./persist-whoop-cycle-records";
import { resolveWhoopSyncFlags } from "./resolve-whoop-sync-flags";
import { buildCyclesPath, chunkWindow } from "./whoop-cycles-window";
import type { WhoopFetchResult } from "./whoop-fetch-result";

export type SyncWhoopCyclesDeps = {
  policyRepo: IntegrationPolicyRepository;
  importedRecords: ImportedRecordRepository;
  fetchCycles: (path: string) => Promise<WhoopFetchResult>;
};

export type SyncWhoopCyclesInput = {
  profileId: string;
  userId: number;
  startTime: string;
  endTime: string;
};

export type SyncWhoopCyclesResult =
  | ({ ok: true } & WhoopPersistCounts)
  | { ok: false; reason: "no-policy" | "transport-error"; error?: string };

const transportError = (error?: string): SyncWhoopCyclesResult => ({
  ok: false,
  reason: "transport-error",
  error,
});

const mergeCounts = (
  totals: WhoopPersistCounts,
  counts: WhoopPersistCounts
): void => {
  totals.hrvImported += counts.hrvImported;
  totals.sleepImported += counts.sleepImported;
  totals.strainImported += counts.strainImported;
  totals.vitalsImported += counts.vitalsImported;
  totals.skipped += counts.skipped;
};

export const syncWhoopCycles = async (
  deps: SyncWhoopCyclesDeps,
  input: SyncWhoopCyclesInput
): Promise<SyncWhoopCyclesResult> => {
  const flags = await resolveWhoopSyncFlags(deps.policyRepo, input.profileId);
  if (!flags.hrv && !flags.sleep && !flags.strain && !flags.vitals) {
    return { ok: false, reason: "no-policy" };
  }

  const totals: WhoopPersistCounts = {
    hrvImported: 0,
    sleepImported: 0,
    strainImported: 0,
    vitalsImported: 0,
    skipped: 0,
  };
  for (const window of chunkWindow(input.startTime, input.endTime)) {
    let result: WhoopFetchResult;
    try {
      result = await deps.fetchCycles(buildCyclesPath(input.userId, window));
    } catch (err) {
      return transportError(err instanceof Error ? err.message : String(err));
    }
    if (!result.ok) return transportError(result.error);
    const parsed = whoopCyclesResponseSchema.safeParse(result.data);
    if (!parsed.success) {
      return transportError("Malformed WHOOP cycles response");
    }
    const counts = await persistWhoopCycleRecords(
      deps.importedRecords,
      input.profileId,
      parsed.data,
      flags
    );
    mergeCounts(totals, counts);
  }
  return { ok: true, ...totals };
};
