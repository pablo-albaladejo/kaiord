// Single source of truth: what kaiord manages, and how each kind maps to
// bridge capability tokens. Capability tokens are intentionally typed as
// opaque `string` to preserve the @kaiord/core "domain depends on nothing
// outside" rule (see C-2, P-4 of the consensus plan). The SPA package owns
// the closed Zod enum (bridgeCapabilitySchema) and asserts coverage at runtime.

import type { z } from "zod";

export const managedDataTypes = [
  "workout",
  "planned-session",
  "activity",
  "training-zones",
  "weight",
  "sleep",
  "hrv",
  "daily-wellness",
  "body-composition",
  "stress",
  "strain",
  "vitals",
  "heart-rate-series",
] as const;

export type ManagedDataType = (typeof managedDataTypes)[number];

/** Opaque bridge identifier — a stable string per bridge package (A-9). */
export type BridgeId = string;

/** Projects a payload to the canonical fields that determine identity. */
export type HashProjection<P> = (payload: P) => Record<string, unknown>;

export type ManagedDataRegistryEntry = {
  label: string;
  schema: z.ZodTypeAny;
  capabilities: { import?: string; export?: string };
  hashProjection?: HashProjection<unknown>;
};

export { MANAGED_DATA_REGISTRY } from "./managed-data-type-registry";
