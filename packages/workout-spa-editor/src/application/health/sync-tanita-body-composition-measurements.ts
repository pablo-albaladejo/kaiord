/**
 * Types + pure helpers for `syncTanitaBodyComposition`. Kept out of the
 * use-case file so that stays under the per-file line cap.
 */
import type { KRD, ManagedDataType } from "@kaiord/core";
import { canonicalHash } from "@kaiord/core";

import type { ExportLedgerRepository } from "../export/export-ledger-repository.port";
import type { IntegrationPolicyRepository } from "../integration-policy/integration-policy-repository.port";

export const BODY_COMPOSITION: ManagedDataType = "body-composition";
export const GARMIN_BRIDGE_ID = "garmin-bridge";
// The bridge upload response has no id we surface (the transport resolves void),
// so the ledger records a stable sentinel external id per measurement.
export const GARMIN_UPLOAD_EXTERNAL_ID = "garmin-body-composition";

export type SyncTanitaPhase = "reading" | "parsing" | "encoding" | "uploading";

export type SyncTanitaBodyCompositionDeps = {
  policyRepo: IntegrationPolicyRepository;
  ledgerRepo: ExportLedgerRepository;
  readCsv: () => Promise<string>;
  parse: (csv: string) => KRD[];
  encode: (krd: KRD) => Uint8Array;
  push: (fit: Uint8Array) => Promise<void>;
  onPhase?: (phase: SyncTanitaPhase) => void;
};

export type SyncTanitaBodyCompositionInput = { profileId: string };

export type SyncTanitaResult =
  | { ok: true; uploaded: number; skipped: number }
  | {
      ok: false;
      reason: "route-inactive" | "needs-reauth" | "transport-error";
      error?: string;
    };

export type Measurement = {
  measuredAt: string;
  payload: Record<string, unknown>;
  fit: Uint8Array;
};

/**
 * Stable per-measurement ledger id derived from the measurement timestamp, so a
 * re-run keys the same natural row and SKIPs. Formatted as a v5-shaped UUID to
 * satisfy the export-ledger id contract.
 */
export const measurementRecordId = (measuredAt: string): string => {
  const hex = canonicalHash({ dataType: BODY_COMPOSITION, measuredAt });
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `5${hex.slice(13, 16)}`,
    `8${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join("-");
};

export const toMeasurement = (
  krd: KRD,
  encode: (krd: KRD) => Uint8Array
): Measurement | undefined => {
  const health = krd.extensions?.health;
  const bodyComposition = health?.bodyComposition;
  const weight = health?.weight;
  const measuredAt = bodyComposition?.measuredAt ?? weight?.measuredAt;
  if (!measuredAt) return undefined;
  const payload: Record<string, unknown> = {
    ...(bodyComposition ?? {}),
    ...(weight ? { weightKilograms: weight.weightKilograms } : {}),
    measuredAt,
  };
  return { measuredAt, payload, fit: encode(krd) };
};

export const readNeedsReauth = (err: unknown): boolean =>
  typeof err === "object" &&
  err !== null &&
  (err as { needsReauth?: unknown }).needsReauth === true;

export const errorMessage = (err: unknown): string =>
  err instanceof Error ? err.message : String(err);
