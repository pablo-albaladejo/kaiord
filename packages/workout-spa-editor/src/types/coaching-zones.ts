/**
 * Coaching zones — types for the Train2Go zones-sync flow.
 *
 * Three name layers are intentional:
 *   payload.* — raw bridge output (camelCase, 1-indexed).
 *   incoming.* — Kaiord-shaped, post-mapper, pre-reconciliation.
 *   profile.* — persisted Profile row in IDB.
 *
 * `FieldKey` is the logical identifier; storage paths live elsewhere.
 * Two granularities (per D-FB5): threshold scalars + band-level keys.
 */
import type { z } from "zod";

import type { zonesPayloadSchema } from "./coaching-zones-schema";

export { zonesPayloadSchema } from "./coaching-zones-schema";

type Sport = "cycling" | "running" | "swimming";
type Band = "z1" | "z2" | "z3" | "z4" | "z5";

type HrBoundKey = `${Sport}.heartRateZones.${Band}.${"minBpm" | "maxBpm"}`;
type PowerBoundKey =
  `cycling.powerZones.${Band}.${"minPercent" | "maxPercent"}`;
type PaceBoundKey = `${"running" | "swimming"}.paceZones.${Band}.${
  "minPace" | "maxPace"}`;

export type ThresholdFieldKey =
  | "cycling.thresholds.ftp"
  | "cycling.thresholds.lthr"
  | "running.thresholds.lthr"
  | "running.thresholds.thresholdPaceSecPerKm"
  | "swimming.thresholds.lthr"
  | "swimming.thresholds.cssPaceSecPer100m"
  | "heartRate.max"
  | "bodyWeight";

export type BandFieldKey = HrBoundKey | PowerBoundKey | PaceBoundKey;

export type FieldKey = ThresholdFieldKey | BandFieldKey;

export type WrittenField = { field: FieldKey; value: number };

export type ConflictItem = {
  field: FieldKey;
  current: number;
  incoming: number;
};

export type ConflictDecision = "accept" | "reject";

export type SyncZonesFailureReason =
  "unsupported" | "transport-error" | "shape-mismatch" | "profile-deleted";

export type ZonesPayload = z.infer<typeof zonesPayloadSchema>;
export type HrBandBlock = NonNullable<ZonesPayload["hrZones"]>["cycling"];

export type SyncZonesResult =
  | {
      ok: true;
      applied: WrittenField[];
      conflicts: ConflictItem[];
      payload: ZonesPayload;
    }
  | { ok: false; reason: SyncZonesFailureReason; error?: string };

export type ZonesReconciliation = {
  applied: WrittenField[];
  conflicts: ConflictItem[];
};
