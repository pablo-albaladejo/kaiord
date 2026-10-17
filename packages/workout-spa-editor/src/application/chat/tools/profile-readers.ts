/**
 * The only place a chat read tool's data meets the active profile id.
 *
 * Every reader is bound here to one profile and queries a profile-indexed
 * repository method, so a tool built on `defineReadTool` receives readers
 * that cannot reach another profile's rows — it never sees the
 * `PersistencePort`, the profile id, a table, or an index. The model picks
 * business parameters (range, metric, sport); scope is injected, never chosen.
 */
import type { PersistencePort } from "../../../ports/persistence-port";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingActivityRecord } from "../../../types/coaching-activity-record";
import { loadDailyWellness } from "../../health/load-daily-wellness";
import type { DateRange } from "./clamp-range";

export const HEALTH_METRICS = [
  "sleep",
  "weight",
  "hrv",
  "daily-wellness",
  "body-composition",
  "stress",
] as const;
export type HealthMetric = (typeof HEALTH_METRICS)[number];

export type HealthRow = { date: string; krd: unknown };

type HealthReader = {
  getByProfileAndDateRange: (
    profileId: string,
    from: string,
    to: string
  ) => Promise<ReadonlyArray<HealthRow>>;
};

// Keyed on the finite metric union so the indexed access is a known-present
// property under the build's `noUncheckedIndexedAccess`.
const REPO_BY_METRIC: Record<
  Exclude<HealthMetric, "daily-wellness">,
  (p: PersistencePort) => HealthReader
> = {
  sleep: (p) => p.healthSleep,
  weight: (p) => p.healthWeight,
  hrv: (p) => p.healthHrv,
  "body-composition": (p) => p.healthBodyComposition,
  stress: (p) => p.healthStress,
};

export type ProfileReaders = {
  workouts: (range: DateRange) => Promise<WorkoutRecord[]>;
  coaching: (range: DateRange) => Promise<CoachingActivityRecord[]>;
  health: (
    metric: HealthMetric,
    range: DateRange
  ) => Promise<ReadonlyArray<HealthRow>>;
};

export const bindProfileReaders = (
  persistence: PersistencePort,
  profileId: string
): ProfileReaders => ({
  workouts: (range) =>
    persistence.workouts.getByProfileAndDateRange(
      profileId,
      range.from,
      range.to
    ),
  coaching: (range) =>
    persistence.coaching.getByProfileAndDateRange(
      profileId,
      range.from,
      range.to
    ),
  // Daily wellness is one reading per day combined across sources.
  health: (metric, range) =>
    metric === "daily-wellness"
      ? loadDailyWellness(persistence, profileId, {
          start: range.from,
          end: range.to,
        })
      : REPO_BY_METRIC[metric](persistence).getByProfileAndDateRange(
          profileId,
          range.from,
          range.to
        ),
});
