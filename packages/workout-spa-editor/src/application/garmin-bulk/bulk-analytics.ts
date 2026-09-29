/**
 * `garmin-calendar-bulk{counts}` (design §3.8): per-status counts only —
 * never an id, a date or a name.
 */
import type { AnalyticsEvent } from "@kaiord/core";

import type { BulkOutcome, BulkStatus } from "./send-week-to-garmin";

export const BULK_EVENT = "garmin-calendar-bulk";

const STATUSES: readonly BulkStatus[] = [
  "scheduled",
  "moved",
  "unchanged",
  "duplicate-left",
  "uncertain",
  "library-only",
  "not-eligible",
  "failed",
];

export const bulkCounts = (
  outcomes: readonly BulkOutcome[]
): Record<BulkStatus, number> =>
  Object.fromEntries(
    STATUSES.map((s) => [s, outcomes.filter((o) => o.status === s).length])
  ) as Record<BulkStatus, number>;

export const bulkEvent = (outcomes: readonly BulkOutcome[]): AnalyticsEvent =>
  bulkCounts(outcomes);
