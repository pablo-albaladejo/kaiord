/**
 * CoachingActivity — Generic type for planned activities from
 * external coaching platforms (Train2Go, TrainingPeaks, etc.).
 *
 * Calendar components consume this type only — never platform-specific types.
 * Each platform adapter maps its raw data to CoachingActivity at the boundary.
 */

export type ActivityStatus = "pending" | "completed" | "skipped";

export type CoachingActivity = {
  /** Unique across platforms: "{source}:{platformId}" */
  id: string;
  /** Platform identifier (e.g., "train2go", "trainingpeaks") */
  source: string;
  /** Short label for UI badge (e.g., "T2G", "TP") */
  sourceBadge: string;
  /** ISO date string YYYY-MM-DD */
  date: string;
  sport: { label: string; icon: string };
  title: string;
  duration?: string;
  /** Normalized effort 1-5. Mappers must clamp to this range. */
  effort?: 1 | 2 | 3 | 4 | 5;
  status: ActivityStatus;
  description?: string;
};
