/**
 * What a placement result says to the athlete, as a translation key and
 * its dates. Tones: a placed workout is stated plainly; a workout that is
 * in Garmin but needs the athlete (a duplicate, an unconfirmed entry, no
 * date) is a warning, never an error; only a failed run is danger.
 */
import type { ConnectionState } from "../../../application/connections/connection-state";
import type { PlacementNotice } from "../../../application/garmin-placement/placement-notice";
import type { PlacementResult } from "../../../application/garmin-placement/placement-result";

export type PlacementTone = "plain" | "warning" | "danger";

export type PlacementMessage = {
  tone: PlacementTone;
  key: string;
  /** The date the message names, `YYYY-MM-DD`. */
  date?: string;
  /** Where entries were left behind (`duplicate-left`, `foreign-left`). */
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
    case "foreign-left":
      return {
        tone: "warning",
        key: "placement.foreignLeft",
        date,
        dates: result.dates,
      };
    case "uncertain":
      return { tone: "warning", key: "placement.uncertain", date: result.date };
    case "library-only":
      return { tone: "warning", key: `placement.libraryOnly.${result.reason}` };
    case "failed":
      // A deletion mid-run may leave an entry in Garmin on `date`.
      return result.reason === "record-deleted" && result.date
        ? {
            tone: "danger",
            key: "placement.recordDeletedOn",
            date: result.date,
          }
        : { tone: "danger", key: `placement.failed.${result.reason}` };
  }
};

/** Silence is for plain results: anything else keeps the ribbon up. */
export const needsAthlete = (notice: PlacementNotice): boolean =>
  notice.removable.length > 0 ||
  (notice.result !== undefined &&
    placementMessage(notice.result, "").tone !== "plain");

/**
 * A placement that stopped because of the Garmin Connection carries that
 * Connection's notice, the words every other surface shows: Garmin refused the
 * sign-in, did not answer in time, or the extension cannot write the calendar.
 */
export const placementConnection = (
  result: PlacementResult
): ConnectionState | null => {
  if (result.kind === "library-only") {
    return result.reason === "bridge-outdated" ? "outdated" : null;
  }
  if (result.kind !== "failed") return null;
  if (result.reason === "needs-reauth") return "signed-out";
  if (
    result.reason === "deadline-before-send" ||
    result.reason === "calendar-unreadable"
  ) {
    return "not-answering";
  }
  return null;
};
