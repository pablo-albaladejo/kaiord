/**
 * Coaching zones — types for the Train2Go zones-sync flow.
 *
 * Three name layers are intentional:
 *
 *   payload.*   — raw bridge output (e.g., payload.paces.cycling.z4Upper).
 *                 Camelcase, 1-indexed zones. The `ZonesPayload` shape.
 *   incoming.*  — Kaiord-shaped, post-mapper, pre-reconciliation
 *                 (e.g., incoming.cycling.thresholds.ftp). Internal to
 *                 the syncZones use case.
 *   profile.*   — persisted Profile row in IDB (full Kaiord schema).
 *
 * `FieldKey` is a logical identifier the use case + UI use to label
 * conflicts and route writes; it is NOT the persisted-storage path.
 */
import { z } from "zod";

/**
 * Logical identifiers for zones-sync target fields. The UI's static
 * label map is keyed by these so T2G strings never reach React's
 * children — see `ZonesConflictDialog` (no `dangerouslySetInnerHTML`).
 */
export type FieldKey =
  | "cycling.thresholds.ftp"
  | "cycling.thresholds.lthr"
  | "running.thresholds.lthr"
  | "running.thresholds.thresholdPaceSecPerKm"
  | "swimming.thresholds.cssPaceSecPer100m"
  | "heartRate.max"
  | "bodyWeight";

export type WrittenField = {
  field: FieldKey;
  value: number;
};

export type ConflictItem = {
  field: FieldKey;
  current: number;
  incoming: number;
};

export type ConflictDecision = "accept" | "reject";

export type SyncZonesFailureReason =
  | "unsupported"
  | "transport-error"
  | "shape-mismatch"
  | "profile-deleted";

export type SyncZonesResult =
  | { ok: true; applied: WrittenField[]; conflicts: ConflictItem[] }
  | { ok: false; reason: SyncZonesFailureReason; error?: string };

export type ZonesReconciliation = {
  applied: WrittenField[];
  conflicts: ConflictItem[];
};

const minSecSchema = z.object({
  min: z.number().int().min(0),
  sec: z.number().int().min(0).max(59),
});

const physiologicalSchema = z
  .object({
    weight: z.number().positive().optional(),
    bpmMax: z.number().int().positive().max(250).optional(),
  })
  .optional();

const cyclingPacesSchema = z
  .object({
    z4Upper: z.number().int().nonnegative().optional(),
    z5Lower: z.number().int().nonnegative().optional(),
  })
  .optional();

const runSwimPacesSchema = z
  .object({
    z4Upper: minSecSchema.optional(),
  })
  .optional();

const hrSportSchema = z
  .object({
    z4Upper: z.number().int().positive().max(250).optional(),
  })
  .optional();

/**
 * Raw-shape bridge output — the exact object `parseDetailsHtml` returns.
 * The mapper translates this to Kaiord-domain `incoming.*` shape inside
 * the syncZones use case. Keep this type aligned with the bridge parser
 * allowlist (see `packages/train2go-bridge/parser.js`).
 */
export const zonesPayloadSchema = z.object({
  physiological: physiologicalSchema,
  paces: z
    .object({
      cycling: cyclingPacesSchema,
      running: runSwimPacesSchema,
      swimming: runSwimPacesSchema,
    })
    .optional(),
  hrZones: z
    .object({
      cycling: hrSportSchema,
      running: hrSportSchema,
    })
    .optional(),
});

export type ZonesPayload = z.infer<typeof zonesPayloadSchema>;
