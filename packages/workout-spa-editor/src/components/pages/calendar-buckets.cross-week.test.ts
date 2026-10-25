/**
 * A moved session renders once, on its effective day (design §3.6, AC-7,
 * AC-28): the plan is hidden on the coach's day, the workout and its
 * recordings never render solo, and a session matched in another week hides
 * its plan and workout from this week.
 */
import { describe, expect, it } from "vitest";

import type { MatchedSessionWithMetadata } from "../../hooks/use-matched-sessions";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { CoachingActivity } from "../../types/coaching-activity";
import type { SessionMatch } from "../../types/session-match";
import { buildCalendarBuckets } from "./calendar-buckets";
import { buildTodayBuckets } from "./Daily/build-today-buckets";

const W1 = ["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-11"];
const W2 = ["2026-10-12", "2026-10-13", "2026-10-15"];
const [, TUE, WED, SUN] = W1;
const [MON2, , THU2] = W2;

const plan = (date: string): CoachingActivity => ({
  id: "train2go:1",
  source: "train2go",
  sourceBadge: "T2G",
  date,
  sport: { label: "Cycling", icon: "bike" },
  title: "Threshold",
  status: "pending",
});

const planned = (date: string) =>
  ({
    id: "w",
    date,
    coachDate: date,
    sport: "cycling",
    source: "train2go",
    state: "structured",
  }) as WorkoutRecord;

const recording = (date: string) =>
  ({ id: "rec", date, sport: "cycling", source: "garmin" }) as WorkoutRecord;

const session = (
  date: string,
  match: Partial<SessionMatch> = {},
  activityDate = TUE!
): MatchedSessionWithMetadata => ({
  match: {
    id: "m",
    profileId: "p1",
    coachingActivityId: "p1:train2go:1",
    workoutId: "w",
    date,
    createdAt: "2026-10-01T08:00:00.000Z",
    source: "auto-coaching",
    executedWorkoutIds: [],
    ...match,
  },
  activity: plan(activityDate),
  workout: planned(date),
});

describe("buildCalendarBuckets after a move", () => {
  it("should put an athlete-moved session only on its new day", () => {
    // Arrange
    const args = {
      days: W1,
      coachingByDay: { [TUE!]: [plan(TUE!)] },
      workoutsByDay: { [WED!]: [planned(WED!)] },
      matched: [session(WED!)],
    };

    // Act
    const buckets = buildCalendarBuckets(args);

    // Assert
    expect(buckets.matchedByDay[WED!]).toHaveLength(1);
    expect(buckets.matchedByDay[TUE!]).toEqual([]);
    expect(buckets.soloPlansByDay[TUE!]).toEqual([]);
    expect(buckets.soloActualsByDay[WED!]).toEqual([]);
  });

  it("should put a coach-moved session only on the coach's new day", () => {
    // Arrange
    const args = {
      days: W1,
      coachingByDay: { [WED!]: [plan(WED!)] },
      workoutsByDay: { [WED!]: [planned(WED!)] },
      matched: [session(WED!, {}, WED!)],
    };

    // Act
    const buckets = buildCalendarBuckets(args);

    // Assert
    expect(buckets.matchedByDay[WED!]).toHaveLength(1);
    expect(buckets.soloPlansByDay[WED!]).toEqual([]);
    expect(buckets.soloActualsByDay[WED!]).toEqual([]);
  });

  it("should hide a plan matched in the next week from its own week", () => {
    // Arrange
    const args = {
      days: W1,
      coachingByDay: { [SUN!]: [plan(SUN!)] },
      workoutsByDay: {},
      matched: [],
      crossWeekMatchedActivityIds: new Set(["train2go:1"]),
      crossWeekMatchedWorkoutIds: new Set(["w"]),
    };

    // Act
    const buckets = buildCalendarBuckets(args);

    // Assert
    expect(buckets.soloPlansByDay[SUN!]).toEqual([]);
    expect(buckets.matchedByDay[SUN!]).toEqual([]);
  });

  it("should show the session moved into this week on its new day", () => {
    // Arrange
    const args = {
      days: W2,
      coachingByDay: {},
      workoutsByDay: { [MON2!]: [planned(MON2!)] },
      matched: [session(MON2!, {}, SUN!)],
    };

    // Act
    const buckets = buildCalendarBuckets(args);

    // Assert
    expect(buckets.matchedByDay[MON2!]).toHaveLength(1);
    expect(buckets.soloActualsByDay[MON2!]).toEqual([]);
  });

  it("should not show a locked session's coach-moved workout or recording solo in the next week", () => {
    // Arrange
    const args = {
      days: W2,
      coachingByDay: { [THU2!]: [plan(THU2!)] },
      workoutsByDay: { [THU2!]: [planned(THU2!), recording(THU2!)] },
      matched: [],
      crossWeekMatchedActivityIds: new Set(["train2go:1"]),
      crossWeekMatchedWorkoutIds: new Set(["w", "rec"]),
    };

    // Act
    const buckets = buildCalendarBuckets(args);

    // Assert
    expect(buckets.soloActualsByDay[THU2!]).toEqual([]);
    expect(buckets.soloPlansByDay[THU2!]).toEqual([]);
  });
});

describe("buildTodayBuckets after a cross-week move", () => {
  it("should show no solo card for a locked session's coach-moved workout", () => {
    // Arrange
    const args = {
      dayIsos: W2,
      focusIso: THU2!,
      weekWorkouts: [planned(THU2!), recording(THU2!)],
      coachingByDay: { [THU2!]: [plan(THU2!)] },
      matched: [],
      crossWeekMatchedActivityIds: new Set(["train2go:1"]),
      crossWeekMatchedWorkoutIds: new Set(["w", "rec"]),
    };

    // Act
    const today = buildTodayBuckets(args);

    // Assert
    expect(today).toEqual({
      matchedSessions: [],
      soloPlans: [],
      soloActuals: [],
    });
  });
});
