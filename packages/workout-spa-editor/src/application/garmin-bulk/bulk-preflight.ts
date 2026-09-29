/**
 * The bulk pre-flight, once per run (design §3.7, AC-45): an active
 * `workout` export route to Garmin and Web Locks. A failure is one message
 * and 0 calls. A bridge without `calendar-write-v1` is NOT a pre-flight
 * failure: each eligible item then ends `library-only{bridge-outdated}`.
 */
import { libraryOnlyReason } from "../garmin-placement/placement-preflight";
import { CALENDAR_WRITE_FEATURE } from "../garmin-placement/placement-timing";

export type BulkPreflightFailure =
  "no-export-route" | "insecure-context" | "unsupported-browser";

export const bulkPreflight = (input: {
  routeActive: boolean;
  locks: unknown;
  secureContext: boolean;
}): BulkPreflightFailure | undefined => {
  if (!input.routeActive) return "no-export-route";
  return libraryOnlyReason({ ...input, features: [CALENDAR_WRITE_FEATURE] })
    ?.reason as BulkPreflightFailure | undefined;
};
