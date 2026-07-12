/**
 * syncWhoopHeartRate — governed import of WHOOP `metrics-service` heart_rate
 * samples for a bounded date window (Wave 3a.3).
 *
 * Gates the pull on the import policy resolver BEFORE fetching: with no
 * enabled `heart-rate-series←whoop-bridge` route the sync never touches the
 * bridge and persists nothing. The HR series is a per-day record, so the
 * window is walked one calendar day at a time (see whoop-metrics-window);
 * each day is fetched, parsed, converted, and upserted by
 * sync-whoop-heart-rate-day.ts, which keeps this orchestrator's loop body
 * under the 40-LOC function cap.
 */
import type { ImportedRecordRepository } from "../import/imported-record-repository.port";
import type { IntegrationPolicyRepository } from "../integration-policy/integration-policy-repository.port";
import { resolveImportPolicies } from "../integration-policy/resolve-import-policies.use-case";
import { syncHeartRateDay } from "./sync-whoop-heart-rate-day";
import type { WhoopFetchResult } from "./whoop-fetch-result";
import { eachCalendarDay } from "./whoop-metrics-window";

const WHOOP_BRIDGE_SOURCE = "whoop-bridge";
const DEFAULT_STEP_SECONDS = 6;

export type SyncWhoopHeartRateDeps = {
  policyRepo: IntegrationPolicyRepository;
  importedRecords: ImportedRecordRepository;
  fetchMetrics: (path: string) => Promise<WhoopFetchResult>;
};

export type SyncWhoopHeartRateInput = {
  profileId: string;
  userId: number;
  startTime: string;
  endTime: string;
  stepSeconds?: number;
};

export type SyncWhoopHeartRateResult =
  | { ok: true; seriesImported: number; skipped: number }
  | {
      ok: false;
      reason: "no-policy" | "transport-error";
      error?: string;
      // Partial progress before a mid-window transport error. Upserts are
      // already persisted and idempotent, so callers can report/resume from
      // how many days actually landed rather than assuming zero.
      seriesImported?: number;
      skipped?: number;
    };

const isEnabled = async (
  policyRepo: IntegrationPolicyRepository,
  profileId: string
): Promise<boolean> => {
  const policies = await resolveImportPolicies(
    { policyRepo },
    { profileId, dataType: "heart-rate-series" }
  );
  return policies.some((p) => p.enabled && p.bridgeId === WHOOP_BRIDGE_SOURCE);
};

export const syncWhoopHeartRate = async (
  deps: SyncWhoopHeartRateDeps,
  input: SyncWhoopHeartRateInput
): Promise<SyncWhoopHeartRateResult> => {
  const enabled = await isEnabled(deps.policyRepo, input.profileId);
  if (!enabled) return { ok: false, reason: "no-policy" };

  const stepSeconds = input.stepSeconds ?? DEFAULT_STEP_SECONDS;
  let seriesImported = 0;
  let skipped = 0;
  for (const day of eachCalendarDay(input.startTime, input.endTime)) {
    const outcome = await syncHeartRateDay(
      {
        importedRecords: deps.importedRecords,
        fetchMetrics: deps.fetchMetrics,
      },
      { profileId: input.profileId, userId: input.userId },
      day,
      stepSeconds
    );
    if (outcome.status === "transport-error") {
      return {
        ok: false,
        reason: "transport-error",
        error: outcome.error,
        seriesImported,
        skipped,
      };
    }
    if (outcome.status === "imported") seriesImported += 1;
    else skipped += 1;
  }
  return { ok: true, seriesImported, skipped };
};
