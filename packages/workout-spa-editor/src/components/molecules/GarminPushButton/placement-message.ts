/**
 * What a placement result says to the athlete, as a translation key and
 * its dates. Tones: a placed workout is stated plainly; a workout that is
 * in Garmin but needs the athlete (a duplicate, an unconfirmed entry, no
 * date) is a warning, never an error; only a failed run is danger.
 */
import type { PlacementNotice } from "../../../application/garmin-placement/placement-notice";
import type { PlacementResult } from "../../../application/garmin-placement/placement-result";

export type PlacementTone = "plain" | "warning" | "danger";

export type PlacementMessage = {
  tone: PlacementTone;
  key: string;
  /** The date the message names, `YYYY-MM-DD`. */
  date?: string;
  /** Where entries were left behind (`duplicate-left`). */
  dates?: string[];
};

export const placementMessage = (
  result: PlacementResult,
  date: string
): PlacementMessage => {
  switch (result.kind) {
    case "scheduled":
    case "moved":
    case "unchanged":
      return { tone: "plain", key: `placement.${result.kind}`, date };
    case "duplicate-left":
      return {
        tone: "warning",
        key: "placement.duplicateLeft",
        date,
        dates: result.dates,
      };
    case "uncertain":
      return { tone: "warning", key: "placement.uncertain", date: result.date };
    case "library-only":
      return { tone: "warning", key: `placement.libraryOnly.${result.reason}` };
    case "failed":
      return { tone: "danger", key: `placement.failed.${result.reason}` };
  }
};

/** Silence is for plain results: anything else keeps the ribbon up. */
export const needsAthlete = (notice: PlacementNotice): boolean =>
  notice.removable.length > 0 ||
  (notice.result !== undefined &&
    placementMessage(notice.result, "").tone !== "plain");
