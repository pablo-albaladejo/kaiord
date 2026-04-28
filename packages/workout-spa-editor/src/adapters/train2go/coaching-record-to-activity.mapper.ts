/**
 * Coaching Record-to-ViewModel Mapper.
 *
 * Maps CoachingActivityRecord (persisted) → CoachingActivity (UI view).
 * Platform-agnostic by design: any future coaching adapter renders into
 * the same view-model. Train2Go-specific sport-icon mapping lives here
 * for now (the only coaching source today).
 */

import type { CoachingActivity } from "../../types/coaching-activity";
import type { CoachingActivityRecord } from "../../types/coaching-activity-record";
import { getT2GSportDisplay } from "./train2go-sport-map";

const BADGE_BY_SOURCE: Record<string, string> = {
  train2go: "T2G",
};

export const toCoachingActivity = (
  record: CoachingActivityRecord
): CoachingActivity => ({
  id: `${record.source}:${record.sourceId}`,
  source: record.source,
  sourceBadge: BADGE_BY_SOURCE[record.source] ?? record.source.toUpperCase(),
  date: record.date,
  sport: getT2GSportDisplay(record.sport),
  title: record.title,
  duration: record.duration || undefined,
  effort: record.intensity,
  status: record.status,
  description: record.description,
});
