/**
 * The bulk pre-flight, once per run (design §3.7, AC-45): an active
 * `workout` export route to Garmin, a working Garmin Connection, and Web
 * Locks. A failure is one message and 0 calls; a Connection that does not
 * work is its own state, worded by `connectionNotice`. A bridge without `calendar-write-v1` is NOT a pre-flight
 * failure: each eligible item then ends `library-only{bridge-outdated}`.
 */
import type { ConnectionState } from "../connections/connection-state";
import { connectionMayBeUsed } from "../connections/connection-state";
import { libraryOnlyReason } from "../garmin-placement/placement-preflight";
import { CALENDAR_WRITE_FEATURE } from "../garmin-placement/placement-timing";

export type BulkPreflightFailure =
  | "no-export-route"
  | Exclude<ConnectionState, "working" | "not-checked">
  | "insecure-context"
  | "unsupported-browser";

export const bulkPreflight = (input: {
  routeActive: boolean;
  connection: ConnectionState;
  locks: unknown;
  secureContext: boolean;
}): BulkPreflightFailure | undefined => {
  if (!input.routeActive) return "no-export-route";
  if (!connectionMayBeUsed(input.connection)) return input.connection;
  // Only the Web Locks half of the single-push check applies here: an
  // outdated bridge is not a pre-flight failure (see above).
  const noLocks = libraryOnlyReason({
    ...input,
    features: [CALENDAR_WRITE_FEATURE],
  });
  switch (noLocks?.reason) {
    case "insecure-context":
    case "unsupported-browser":
      return noLocks.reason;
    default:
      return undefined;
  }
};
