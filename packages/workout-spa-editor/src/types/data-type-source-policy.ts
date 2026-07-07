/**
 * DataTypeSourcePolicy — per-(profile, dataType) multi-source semantics.
 *
 * Companion to IntegrationPolicy, not an extension of it: IntegrationPolicy
 * is keyed per-bridge ([profileId+dataType+direction+bridgeId]); this is
 * keyed per-type ([profileId+dataType]) and says how to reconcile MULTIPLE
 * bridges importing the same data type — "union" (show every source) or
 * "priority" (one winner, ranked by `sourceOrder`). Extending
 * IntegrationPolicy would denormalize the per-type semantic across every
 * per-bridge row (update anomaly) — see F3.1 decision.
 *
 * No row for a (profileId, dataType) pair means the default: "union".
 */
import { managedDataTypes } from "@kaiord/core";
import { z } from "zod";

export const dataTypeSourceModeSchema = z.enum(["union", "priority"]);
export type DataTypeSourceMode = z.infer<typeof dataTypeSourceModeSchema>;

export const DEFAULT_DATA_TYPE_SOURCE_MODE: DataTypeSourceMode = "union";

export const dataTypeSourcePolicySchema = z.object({
  profileId: z.string().uuid(),
  dataType: z.enum(managedDataTypes),
  mode: dataTypeSourceModeSchema,
  /** Bridge ids in priority order (only meaningful when mode="priority"). */
  sourceOrder: z.array(z.string()),
});
export type DataTypeSourcePolicy = z.infer<typeof dataTypeSourcePolicySchema>;
