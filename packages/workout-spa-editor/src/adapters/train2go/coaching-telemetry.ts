/**
 * Telemetry helpers for coaching action callbacks.
 * PII-free payloads (per spec §12). No profile identifier is sent: even
 * a local-only id is a stable per-person key once it reaches Umami.
 *
 * Internal AttemptLinkResult/SyncWeekResult `reason` enums are normalized
 * to a documented telemetry taxonomy so internal renames don't leak.
 */

import type { Analytics } from "@kaiord/core";

import type { AttemptLinkResult } from "../../application/coaching/attempt-link";
import type { SyncWeekResult } from "../../application/coaching/sync-week";

const SYNC_FAILURE_KIND = (reason: string): string => {
  switch (reason) {
    case "route-inactive":
    case "not-linked":
    case "session-expired":
    case "transport-error":
      return reason;
    default:
      return "unknown";
  }
};

const LINK_FAILURE_KIND = (reason: string): string => {
  switch (reason) {
    case "profile-deleted":
    case "session-not-active":
    case "transport-error":
      return reason;
    default:
      return "unknown";
  }
};

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
      errorKind: SYNC_FAILURE_KIND(result.reason),
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
    errorKind: LINK_FAILURE_KIND(result.reason),
  });
};
