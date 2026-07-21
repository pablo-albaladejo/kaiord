/**
 * Maps a WHOOP KRD `Activity` (produced by `@kaiord/whoop`'s
 * `workoutToActivity`) into a persisted ActivityRecord.
 *
 * Summary only — WHOOP's `cycles/details` carries no recorded detail, so
 * `krd` stays null (never forced). Provenance is stamped through the shared
 * `stampProvenance` helper: source `whoop-bridge`, externalId = the WHOOP
 * workout `activity_id` (stable dedup key, surfaced as `summary.source_id`
 * by `workoutToActivity`). Returns null when the summary has no usable
 * calendar date or source id, so the caller can skip it rather than persist
 * garbage.
 */
import type { Activity } from "@kaiord/core";

import type { ActivityRecord } from "../../types/activity-record";
import { buildSourceActivityRecord } from "../../types/activity-record";
import { stampProvenance } from "./stamp-provenance";

export const WHOOP_BRIDGE_SOURCE = "whoop-bridge";

export const mapWhoopActivity = (
  activity: Activity,
  profileId: string
): ActivityRecord | null => {
  const { summary } = activity;
  if (!summary.date || !summary.source_id) return null;

  const provenance = stampProvenance(WHOOP_BRIDGE_SOURCE, summary.source_id);
  return buildSourceActivityRecord({
    profileId,
    date: summary.date,
    sport: summary.sport,
    sourceBridgeId: provenance.sourceBridgeId,
    externalId: provenance.externalId,
    durationSeconds: summary.duration_seconds,
    distanceMeters: summary.distance_meters,
    avgHeartRate: summary.avg_heart_rate,
    totalCalories: summary.total_calories,
  });
};
