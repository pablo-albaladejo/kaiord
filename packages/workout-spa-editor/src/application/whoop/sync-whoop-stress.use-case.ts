/**
 * syncWhoopStress — governed import of WHOOP `health-service/v2/stress-bff`
 * daily stress episodes for a bounded date window (Wave 4a).
 *
 * Gates the pull on the import policy resolver BEFORE fetching: with no
 * enabled `stress←whoop-bridge` route the sync never touches the bridge and
 * persists nothing. Stress is a per-day record like heart-rate-series, so
 * the window is walked one calendar day at a time (see whoop-metrics-window);
 * each day is fetched, parsed, converted, and upserted by
 * sync-whoop-stress-day.ts, which keeps this orchestrator's loop body under
 * the function-size cap.
 */
import type { ImportedRecordRepository } from "../import/imported-record-repository.port";
import type { IntegrationPolicyRepository } from "../integration-policy/integration-policy-repository.port";
import { resolveImportPolicies } from "../integration-policy/resolve-import-policies.use-case";
import { syncStressDay } from "./sync-whoop-stress-day";
import type { WhoopFetchResult } from "./whoop-fetch-result";
import { eachCalendarDay } from "./whoop-metrics-window";

const WHOOP_BRIDGE_SOURCE = "whoop-bridge";

export type SyncWhoopStressDeps = {
  policyRepo: IntegrationPolicyRepository;
  importedRecords: ImportedRecordRepository;
  fetchStress: (path: string) => Promise<WhoopFetchResult>;
};

export type SyncWhoopStressInput = {
  profileId: string;
  userId: number;
  startTime: string;
  endTime: string;
};

export type SyncWhoopStressResult =
  | { ok: true; episodesImported: number; skipped: number }
  | {
      ok: false;
      reason: "no-policy" | "transport-error";
      error?: string;
      // Partial progress before a mid-window transport error. Upserts are
      // already persisted and idempotent, so callers can report/resume from
      // how many days actually landed rather than assuming zero.
      episodesImported?: number;
      skipped?: number;
    };

const isEnabled = async (
  policyRepo: IntegrationPolicyRepository,
  profileId: string
): Promise<boolean> => {
  const policies = await resolveImportPolicies(
    { policyRepo },
    { profileId, dataType: "stress" }
  );
  return policies.some((p) => p.enabled && p.bridgeId === WHOOP_BRIDGE_SOURCE);
};

export const syncWhoopStress = async (
  deps: SyncWhoopStressDeps,
  input: SyncWhoopStressInput
): Promise<SyncWhoopStressResult> => {
  const enabled = await isEnabled(deps.policyRepo, input.profileId);
  if (!enabled) return { ok: false, reason: "no-policy" };

  let episodesImported = 0;
  let skipped = 0;
  for (const day of eachCalendarDay(input.startTime, input.endTime)) {
    const outcome = await syncStressDay(
      {
        importedRecords: deps.importedRecords,
        fetchStress: deps.fetchStress,
      },
      { profileId: input.profileId, userId: input.userId },
      day
    );
    if (outcome.status === "transport-error") {
      return {
        ok: false,
        reason: "transport-error",
        error: outcome.error,
        episodesImported,
        skipped,
      };
    }
    if (outcome.status === "imported") episodesImported += 1;
    else skipped += 1;
  }
  return { ok: true, episodesImported, skipped };
};
