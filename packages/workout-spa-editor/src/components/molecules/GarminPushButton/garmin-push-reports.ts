/**
 * What one send reports (design §3.8): `garmin-synced` once per run, and —
 * for a send that throws before the pipeline could measure it — its one
 * `garmin-calendar-placement` event, as a failed library push.
 */
import type { Analytics } from "@kaiord/core";

import { placementEvent } from "../../../application/garmin-placement/placement-analytics";
import {
  failed,
  isPlacementSent,
  type PlacementResult,
} from "../../../application/garmin-placement/placement-result";

export const garminPushReports = (analytics: Analytics, startedAt: number) => {
  const synced = (result: PlacementResult) =>
    analytics.event("garmin-synced", {
      result: isPlacementSent(result) ? "success" : "failure",
    });
  const failedEarly = (): PlacementResult => {
    const result = failed("library-push-failed", true);
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
