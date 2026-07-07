/**
 * Managed data types with a REAL manual-entry path in the SPA today — a
 * DOCUMENTED exception to capability-derivation (these are code paths, not wire
 * tokens, so they cannot be derived from MANAGED_DATA_REGISTRY): `workout` +
 * `activity` (file drop / editor), the six health metrics (FIT drop + manual /
 * chat entry), and `training-zones` (profile zone editing). `planned-session`
 * is deliberately absent — there is no manual way to author a coach session, so
 * the Manual column renders it n/a (honest state over a fake always-active
 * cell). Consumed by the Data Hub matrix.
 */
import type { ManagedDataType } from "@kaiord/core";

export const MANUAL_ENTRY_TYPES: ReadonlySet<ManagedDataType> = new Set([
  "workout",
  "activity",
  "weight",
  "sleep",
  "hrv",
  "daily-wellness",
  "body-composition",
  "stress",
  "training-zones",
]);
