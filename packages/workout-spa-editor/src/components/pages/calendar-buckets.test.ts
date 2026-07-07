import { describe, expect, it } from "vitest";

import type { MatchedSessionWithMetadata } from "../../hooks/use-matched-sessions";
import {
  type ActivityRecord,
  buildSourceActivityRecord,
} from "../../types/activity-record";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { CoachingActivity } from "../../types/coaching-activity";
import type { SessionMatch } from "../../types/session-match";
import { buildCalendarBuckets } from "./calendar-buckets";

const DAY = "2026-04-29";
const DAYS = ["2026-04-27", "2026-04-28", DAY, "2026-04-30"];

const activity = (
  overrides: Partial<CoachingActivity> = {}
): CoachingActivity => ({
  id: "train2go:1",
  source: "train2go",
  sourceBadge: "T2G",
  date: DAY,
  sport: { label: "Cycling", icon: "bike" },
  title: "FTP test",
  status: "pending",
  ...overrides,
});

const workout = (overrides: Partial<WorkoutRecord> = {}): WorkoutRecord =>
  ({
    id: "w-1",
    date: DAY,
    sport: "cycling",
    source: "train2go",
    sourceId: "p1:1",
    state: "structured",
    raw: { title: "FTP", duration: { value: 3600, unit: "s" } },
    ...overrides,
  }) as WorkoutRecord;

const match = (overrides: Partial<SessionMatch> = {}): SessionMatch => ({
  id: "m-1",
  profileId: "p1",
  coachingActivityId: "p1:train2go:1",
  workoutId: "w-1",
  date: DAY,
  createdAt: "2026-04-28T10:00:00.000Z",
  source: "auto-coaching",
  executedWorkoutIds: [],
  ...overrides,
});

const matched = (
  overrides: Partial<MatchedSessionWithMetadata> = {}
): MatchedSessionWithMetadata => ({
  match: match(),
  activity: activity(),
  workout: workout(),
  complianceScore: 0.95,
  ...overrides,
});

describe("buildCalendarBuckets", () => {
  it("should mask both lanes when a match references the activity and the workout on that day", () => {
    // Arrange
    const ms = matched();
    const args = {
      days: DAYS,
      coachingByDay: { [DAY]: [activity()] },
      workoutsByDay: { [DAY]: [workout()] },
      matched: [ms],
    };

    // Act
    const buckets = buildCalendarBuckets(args);

    // Assert
    expect(buckets.matchedByDay[DAY]).toHaveLength(1);
    expect(buckets.matchedByDay[DAY]?.[0]?.match.id).toBe("m-1");
    expect(buckets.soloPlansByDay[DAY]).toEqual([]);
    expect(buckets.soloActualsByDay[DAY]).toEqual([]);
  });

  it("should leave a coaching activity in solo plans when no match references it", () => {
    // Arrange
    const orphanActivity = activity({ id: "train2go:7" });
    const args = {
      days: DAYS,
      coachingByDay: { [DAY]: [orphanActivity] },
      workoutsByDay: { [DAY]: [] },
      matched: [],
    };

    // Act
    const buckets = buildCalendarBuckets(args);

    // Assert
    expect(buckets.matchedByDay[DAY]).toEqual([]);
    expect(buckets.soloPlansByDay[DAY]).toEqual([orphanActivity]);
    expect(buckets.soloActualsByDay[DAY]).toEqual([]);
  });

  it("should leave a workout in solo actuals when no match references it", () => {
    // Arrange
    const orphanWorkout = workout({ id: "w-7" });
    const args = {
      days: DAYS,
      coachingByDay: { [DAY]: [] },
      workoutsByDay: { [DAY]: [orphanWorkout] },
      matched: [],
    };

    // Act
    const buckets = buildCalendarBuckets(args);

    // Assert
    expect(buckets.matchedByDay[DAY]).toEqual([]);
    expect(buckets.soloPlansByDay[DAY]).toEqual([]);
    expect(buckets.soloActualsByDay[DAY]).toEqual([orphanWorkout]);
  });

  it("should NOT mask the activity when matched.activity.id differs from coachingByDay[d][i].id (H7 regression)", () => {
    // Arrange
    // Exact reproduction of the original Train2Go 2-card bug: the
    // calendar's `coachingByDay` is keyed by view-model SHORT id and
    // the bucketer compares against `matched.activity.id` which is
    // also SHORT. If hydrate returns nothing (because the COMPOSITE
    // join missed), the activity stays solo and the workout stays solo
    // → 2 cards instead of 1.
    const args = {
      days: DAYS,
      coachingByDay: { [DAY]: [activity({ id: "train2go:1" })] },
      workoutsByDay: { [DAY]: [workout()] },
      matched: [], // hydrate silently dropped the match — the symptom
    };

    // Act
    const buckets = buildCalendarBuckets(args);

    // Assert
    expect(buckets.matchedByDay[DAY]).toEqual([]);
    expect(buckets.soloPlansByDay[DAY]).toHaveLength(1);
    expect(buckets.soloPlansByDay[DAY]?.[0]?.id).toBe("train2go:1");
    expect(buckets.soloActualsByDay[DAY]).toHaveLength(1);
    expect(buckets.soloActualsByDay[DAY]?.[0]?.id).toBe("w-1");
  });

  it("should suppress an executed workout listed in match.executedWorkoutIds from soloActuals", () => {
    // Arrange
    const executed = workout({ id: "w-exec-1", source: "garmin" });
    const ms = matched({
      match: match({ executedWorkoutIds: ["w-exec-1"] }),
    });
    const args = {
      days: DAYS,
      coachingByDay: { [DAY]: [activity()] },
      workoutsByDay: { [DAY]: [workout(), executed] },
      matched: [ms],
    };

    // Act
    const buckets = buildCalendarBuckets(args);

    // Assert
    expect(buckets.matchedByDay[DAY]).toHaveLength(1);
    expect(buckets.soloActualsByDay[DAY]).toEqual([]);
  });

  it("should suppress multiple executeds listed in match.executedWorkoutIds (1-N regression)", () => {
    // Arrange
    const e1 = workout({ id: "w-exec-1", source: "garmin" });
    const e2 = workout({ id: "w-exec-2", source: "fit" });
    const ms = matched({
      match: match({ executedWorkoutIds: ["w-exec-1", "w-exec-2"] }),
    });
    const args = {
      days: DAYS,
      coachingByDay: { [DAY]: [activity()] },
      workoutsByDay: { [DAY]: [workout(), e1, e2] },
      matched: [ms],
    };

    // Act
    const buckets = buildCalendarBuckets(args);

    // Assert
    expect(buckets.soloActualsByDay[DAY]).toEqual([]);
  });

  it("should leave an executed workout solo when it is NOT in any match's executedWorkoutIds (A3)", () => {
    // Arrange
    const orphanExecuted = workout({ id: "w-exec-orphan", source: "garmin" });
    const args = {
      days: DAYS,
      coachingByDay: {},
      workoutsByDay: { [DAY]: [orphanExecuted] },
      matched: [],
    };

    // Act
    const buckets = buildCalendarBuckets(args);

    // Assert
    expect(buckets.soloActualsByDay[DAY]).toEqual([orphanExecuted]);
  });

  it("should tolerate a match whose executedWorkoutIds is absent (raw/pre-v12 row)", () => {
    // Arrange
    // Dexie returns un-parsed rows; a pre-v12 (or raw-seeded) match can lack
    // executedWorkoutIds, which must not crash the bucketer.
    const ms = matched({
      match: match({ executedWorkoutIds: undefined as unknown as string[] }),
    });
    const args = {
      days: DAYS,
      coachingByDay: { [DAY]: [activity()] },
      workoutsByDay: { [DAY]: [workout()] },
      matched: [ms],
    };

    // Act
    const buckets = buildCalendarBuckets(args);

    // Assert
    expect(buckets.matchedByDay[DAY]).toHaveLength(1);
    expect(buckets.soloActualsByDay[DAY]).toEqual([]);
  });

  it("should render an unmatched source-only activity as a solo actual", () => {
    // Arrange
    const act = buildSourceActivityRecord({
      profileId: "p1",
      date: DAY,
      sport: "running",
      sourceBridgeId: "garmin-bridge",
      externalId: "555",
      durationSeconds: 1800,
    });
    const args = {
      days: DAYS,
      coachingByDay: {},
      workoutsByDay: {},
      activitiesByDay: { [DAY]: [act] },
      matched: [],
    };

    // Act
    const buckets = buildCalendarBuckets(args);

    // Assert
    expect(buckets.soloActualsByDay[DAY]).toHaveLength(1);
    expect(buckets.soloActualsByDay[DAY]?.[0]?.id).toBe(act.id);
    expect(buckets.soloActualsByDay[DAY]?.[0]?.source).toBe("garmin-bridge");
  });

  it("should not render a matched source-only activity as a solo actual (no double render)", () => {
    // Arrange
    const act = buildSourceActivityRecord({
      profileId: "p1",
      date: DAY,
      sport: "cycling",
      sourceBridgeId: "garmin-bridge",
      externalId: "9",
    });
    const ms = matched({
      match: match({ executedWorkoutIds: [act.id] }),
    });
    const args = {
      days: DAYS,
      coachingByDay: { [DAY]: [activity()] },
      workoutsByDay: { [DAY]: [workout()] },
      activitiesByDay: { [DAY]: [act] },
      matched: [ms],
    };

    // Act
    const buckets = buildCalendarBuckets(args);

    // Assert
    expect(buckets.soloActualsByDay[DAY]).toEqual([]);
  });

  it("should not project a twin activity whose WorkoutRecord already renders", () => {
    // Arrange
    const twin: ActivityRecord = {
      ...buildSourceActivityRecord({
        profileId: "p1",
        date: DAY,
        sport: "cycling",
        sourceBridgeId: "fit-import",
        externalId: "hash-1",
      }),
      linkedWorkoutId: "w-7",
    };
    const args = {
      days: DAYS,
      coachingByDay: {},
      workoutsByDay: { [DAY]: [workout({ id: "w-7" })] },
      activitiesByDay: { [DAY]: [twin] },
      matched: [],
    };

    // Act
    const buckets = buildCalendarBuckets(args);

    // Assert
    // Only the twin WorkoutRecord renders; the activity is not projected.
    expect(buckets.soloActualsByDay[DAY]).toHaveLength(1);
    expect(buckets.soloActualsByDay[DAY]?.[0]?.id).toBe("w-7");
  });

  it("should produce empty buckets for days with no items in either lane", () => {
    // Arrange
    const args = {
      days: DAYS,
      coachingByDay: {},
      workoutsByDay: {},
      matched: [],
    };

    // Act
    const buckets = buildCalendarBuckets(args);

    // Assert
    for (const d of DAYS) {
      expect(buckets.matchedByDay[d]).toEqual([]);
      expect(buckets.soloPlansByDay[d]).toEqual([]);
      expect(buckets.soloActualsByDay[d]).toEqual([]);
    }
  });
});
