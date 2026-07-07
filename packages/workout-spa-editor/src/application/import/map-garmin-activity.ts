/**
 * Maps a raw Garmin Connect activity into a persisted ActivityRecord.
 *
 * Summary only — the activities-search endpoint carries no recorded detail,
 * so `krd` stays null (never forced). Provenance is stamped through the
 * shared `stampProvenance` helper: source `garmin-bridge`, externalId = the
 * Garmin activityId (stable dedup key). Returns null when the activity has no
 * usable calendar date, so the caller can skip it rather than persist garbage.
 */
import type { ActivityRecord } from "../../types/activity-record";
import { buildSourceActivityRecord } from "../../types/activity-record";
import type { GarminRawActivity } from "./garmin-activity-schema";
import { stampProvenance } from "./stamp-provenance";

export const GARMIN_BRIDGE_SOURCE = "garmin-bridge";
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const toIsoDate = (raw: GarminRawActivity): string | null => {
  const stamp = raw.startTimeLocal ?? raw.startTimeGMT;
  if (!stamp) return null;
  const date = stamp.slice(0, 10);
  return ISO_DATE.test(date) ? date : null;
};

export const mapGarminActivity = (
  raw: GarminRawActivity,
  profileId: string
): ActivityRecord | null => {
  const date = toIsoDate(raw);
  if (!date) return null;
  const provenance = stampProvenance(
    GARMIN_BRIDGE_SOURCE,
    String(raw.activityId)
  );
  return buildSourceActivityRecord({
    profileId,
    date,
    sport: raw.activityType?.typeKey ?? "unknown",
    sourceBridgeId: provenance.sourceBridgeId,
    externalId: provenance.externalId,
    durationSeconds: raw.duration,
    distanceMeters: raw.distance,
  });
};
