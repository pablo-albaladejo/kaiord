/**
 * Train2Go Record Mapper — Wire → Record.
 *
 * Maps Train2GoActivity (wire shape from the bridge extension) to
 * CoachingActivityRecord (the persisted shape).
 *
 * Status mapping (matches Train2Go's wire codes):
 *   0  → "pending"
 *   1  → "completed"
 *   -1 → "skipped"
 *
 * intensity: clamp(workload, 1, 5) when workload > 0; undefined otherwise.
 * The raw `workload` is preserved verbatim (NOT clamped) for analytics
 * that need the platform-native signal.
 *
 * sourceId: stringified at the boundary (we treat the wire numeric id as
 * already-parsed; ideally bridge transport would carry strings end-to-end).
 */

import type { Train2GoActivity } from "../../store/train2go-extension-transport";
import type {
  CoachingActivityRecord,
  CoachingActivityStatus,
} from "../../types/coaching-activity-record";
import { buildCoachingActivityId } from "../../types/coaching-activity-record";

export const TRAIN2GO_STATUS_MAP: Record<number, CoachingActivityStatus> = {
  0: "pending",
  1: "completed",
  [-1]: "skipped",
};

const clampIntensity = (v: number): 1 | 2 | 3 | 4 | 5 =>
  Math.max(1, Math.min(5, v)) as 1 | 2 | 3 | 4 | 5;

export const toCoachingActivityRecord = (
  profileId: string,
  activity: Train2GoActivity,
  fetchedAt: string
): CoachingActivityRecord => {
  const sourceId = String(activity.id);
  return {
    id: buildCoachingActivityId(profileId, "train2go", sourceId),
    profileId,
    source: "train2go",
    sourceId,
    date: activity.date,
    sport: activity.sport,
    title: activity.title,
    duration: activity.duration || undefined,
    workload: activity.workload,
    intensity:
      activity.workload > 0 ? clampIntensity(activity.workload) : undefined,
    status: TRAIN2GO_STATUS_MAP[activity.status] ?? "pending",
    completionPercent: activity.completion,
    description: activity.description,
    fetchedAt,
  };
};
