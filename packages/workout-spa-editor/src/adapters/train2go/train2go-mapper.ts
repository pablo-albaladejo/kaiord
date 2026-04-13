/**
 * Train2Go Mapper — Adapter boundary.
 *
 * Maps Train2GoActivity (platform-specific) to CoachingActivity (generic).
 * This is the only place where Train2Go data shape is translated.
 */

import type { Train2GoActivity } from "../../store/train2go-store";
import type {
  ActivityStatus,
  CoachingActivity,
} from "../../types/coaching-activity";
import { getT2GSportDisplay } from "./train2go-sport-map";

const STATUS_MAP: Record<number, ActivityStatus> = {
  0: "pending",
  1: "completed",
  [-1]: "skipped",
};

const clampEffort = (v: number): 1 | 2 | 3 | 4 | 5 =>
  Math.max(1, Math.min(5, v)) as 1 | 2 | 3 | 4 | 5;

export const toCoachingActivity = (a: Train2GoActivity): CoachingActivity => ({
  id: `train2go:${a.id}`,
  source: "train2go",
  sourceBadge: "T2G",
  date: a.date,
  sport: getT2GSportDisplay(a.sport),
  title: a.title,
  duration: a.duration || undefined,
  effort: a.workload > 0 ? clampEffort(a.workload) : undefined,
  status: STATUS_MAP[a.status] ?? "pending",
  description: a.description,
});
