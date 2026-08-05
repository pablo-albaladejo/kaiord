import type { LastSyncedZonesSnapshot } from "../../types/coaching-account";
import type { SportThresholds } from "../../types/sport-zones";
import type { ActiveSport } from "./sports";

/**
 * Reads a sync snapshot back into the `SportThresholds` shape, so the
 * incoming numbers can be run through exactly the same formatters as the
 * stored ones instead of a second, drift-prone copy of them.
 *
 * The pace units are the ones the snapshot's own key names declare
 * (`runningThresholdPace` is sec/km, `swimmingCss` is sec/100m), not whatever
 * the profile happens to display in.
 */
export function snapshotThresholdsFor(
  sport: ActiveSport,
  snapshot: LastSyncedZonesSnapshot
): SportThresholds {
  if (sport === "cycling") {
    return { ftp: snapshot.cyclingFtp, lthr: snapshot.cyclingLthr };
  }
  if (sport === "running") {
    return {
      lthr: snapshot.runningLthr,
      thresholdPace: snapshot.runningThresholdPace,
      paceUnit: "min_per_km",
    };
  }
  return { thresholdPace: snapshot.swimmingCss, paceUnit: "min_per_100m" };
}
