/**
 * What one send reports (design §3.8): `garmin-synced` once per run, and —
 * for a send that throws before the pipeline could measure it — its one
 * `garmin-calendar-placement` event, as a failed library push (or its
 * specific reason, when the payload could not be built).
 */
import type { Analytics } from "@kaiord/core";

import { placementEvent } from "../../../application/garmin-placement/placement-analytics";
import {
  failed,
  isPlacementSent,
  type PlacementFailureReason,
  type PlacementResult,
} from "../../../application/garmin-placement/placement-result";

export const garminPushReports = (analytics: Analytics, startedAt: number) => {
  const synced = (result: PlacementResult) =>
    analytics.event("garmin-synced", {
      result: isPlacementSent(result) ? "success" : "failure",
    });
  const failedEarly = (
    reason: PlacementFailureReason = "library-push-failed"
  ): PlacementResult => {
    // Only a failed conversion or push may pass on a retry.
    const result = failed(reason, reason === "library-push-failed");
    const durationMs = Date.now() - startedAt;
    analytics.event(
      "garmin-calendar-placement",
      placementEvent(result, durationMs, undefined)
    );
    synced(result);
    return result;
  };
  return { synced, failedEarly };
};
