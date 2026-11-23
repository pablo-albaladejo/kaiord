/**
 * DataTypeSourcePolicy — the athlete's own choice of Authority for one
 * (profile, dataType), made in the matrix Capability or through the
 * assistant's `set_data_route`.
 *
 * Companion to IntegrationPolicy, not an extension of it: IntegrationPolicy
 * is keyed per-bridge ([profileId+dataType+direction+bridgeId]); this is
 * keyed per-type ([profileId+dataType]) and says how to reconcile MULTIPLE
 * sources of the same data type — "union" (keep and show every source),
 * "priority" (one winner, ranked by `sourceOrder`) or "automatic" (the
 * athlete handed the type back to the App's rule). Extending
 * IntegrationPolicy would denormalize the per-type semantic across every
 * per-bridge row (update anomaly) — see F3.1 decision.
 *
 * No row, or a row while the matrix is off, means the App's automatic
 * Authority (`application/data-source-policy/automatic-authority.ts`).
 */
import { managedDataTypes } from "@kaiord/core";
import { z } from "zod";

/** What the assistant may ask for; "automatic" is written by the matrix. */
export const dataTypeSourceModeSchema = z.enum(["union", "priority"]);
export type DataTypeSourceMode = z.infer<typeof dataTypeSourceModeSchema>;

const storedSourceModeSchema = z.enum(["union", "priority", "automatic"]);
export type StoredSourceMode = z.infer<typeof storedSourceModeSchema>;

export const dataTypeSourcePolicySchema = z.object({
  profileId: z.string().uuid(),
  dataType: z.enum(managedDataTypes),
  mode: storedSourceModeSchema,
  /** Bridge ids in priority order (only meaningful when mode="priority"). */
  sourceOrder: z.array(z.string()),
});
export type DataTypeSourcePolicy = z.infer<typeof dataTypeSourcePolicySchema>;
