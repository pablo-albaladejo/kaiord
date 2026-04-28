/**
 * Telemetry helpers for coaching action callbacks.
 * Extracted from use-train2go-actions.ts to keep that file under the
 * lint-enforced size limit. PII-free payloads (per spec §12).
 */

import type { Analytics } from "@kaiord/core";

import type { AttemptLinkResult } from "../../application/coaching/attempt-link";
import type { SyncWeekResult } from "../../application/coaching/sync-week";

export const emitSyncResult = (
  analytics: Analytics,
  source: string,
  result: SyncWeekResult,
  durationMs: number
): void => {
  if (result.ok) {
    analytics.event("coaching.sync.success", {
      source,
      activityCount: result.activityCount,
      orphansDeleted: result.orphansDeleted,
      durationMs,
    });
  } else {
    analytics.event("coaching.sync.failure", {
      source,
      errorKind: result.reason,
      isAutoSync: false,
    });
  }
};

export const emitLinkResult = (
  analytics: Analytics,
  source: string,
  result: AttemptLinkResult
): void => {
  if (result.ok) {
    analytics.event("coaching.link.success", { source });
    return;
  }
  if (result.reason === "aborted") {
    analytics.event("coaching.link.abort", {
      source,
      reason: "user-cancelled",
    });
    return;
  }
  analytics.event("coaching.link.failure", {
    source,
    errorKind: result.reason,
  });
};
