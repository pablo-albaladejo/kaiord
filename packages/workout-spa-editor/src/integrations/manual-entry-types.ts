/**
 * Managed data types with a REAL manual-entry path in the SPA today — a
 * DOCUMENTED exception to capability-derivation (these are code paths, not wire
 * tokens, so they cannot be derived from MANAGED_DATA_REGISTRY): `workout` +
 * `activity` (file drop / editor), the six health metrics (FIT drop + manual /
 * chat entry), `training-zones` (profile zone editing) and `planned-session`
 * (scheduling a workout on the calendar by hand — manual planning is a source,
 * a coach is optional). Types a wearable computes (strain, heart-rate series)
 * stay absent: nobody types them in. Consumed by the Connections page's source
 * derivation and by the chat data-routes tool.
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
  "planned-session",
]);
