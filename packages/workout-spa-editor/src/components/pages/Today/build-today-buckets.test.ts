import { describe, expect, it } from "vitest";

import type { MatchedSessionWithMetadata } from "../../../hooks/use-matched-sessions";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingActivity } from "../../../types/coaching-activity";
import type { SessionMatch } from "../../../types/session-match";
import { buildCalendarBuckets } from "../calendar-buckets";
import { buildTodayBuckets, todayBucketsEmpty } from "./build-today-buckets";

const TODAY = "2026-04-29";
const DAYS = ["2026-04-27", "2026-04-28", TODAY, "2026-04-30"];

const activity = (
  overrides: Partial<CoachingActivity> = {}
): CoachingActivity => ({
  id: "train2go:1",
  source: "train2go",
  sourceBadge: "T2G",
  date: TODAY,
  sport: { label: "Cycling", icon: "bike" },
  title: "FTP test",
  status: "pending",
  ...overrides,
});

const workout = (overrides: Partial<WorkoutRecord> = {}): WorkoutRecord =>
  ({
    id: "w-1",
    date: TODAY,
    sport: "cycling",
    source: "train2go",
    sourceId: "p1:1",
    state: "structured",
    krd: null,
    raw: { title: "FTP", duration: { value: 3600, unit: "s" } },
    ...overrides,
  }) as WorkoutRecord;

const match = (overrides: Partial<SessionMatch> = {}): SessionMatch => ({
  id: "m-1",
  profileId: "p1",
  coachingActivityId: "p1:train2go:1",
  workoutId: "w-1",
  date: TODAY,
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

describe("buildTodayBuckets", () => {
  it("should surface a KRD-less coaching-derived workout as a solo actual", () => {
    // Arrange
    const raw = workout({ id: "w-raw", state: "raw", krd: null });

    // Act
    const buckets = buildTodayBuckets({
      dayIsos: DAYS,
      todayIso: TODAY,
      weekWorkouts: [raw],
      coachingByDay: {},
      matched: [],
    });

    // Assert
    expect(buckets.soloActuals).toHaveLength(1);
    expect(buckets.soloActuals[0].id).toBe("w-raw");
  });

  it("should list multiple coaching activities planned for today", () => {
    // Arrange
    const swim = activity({ id: "a-swim", title: "Swim" });
    const gym = activity({ id: "a-gym", title: "Gym" });

    // Act
    const buckets = buildTodayBuckets({
      dayIsos: DAYS,
      todayIso: TODAY,
      weekWorkouts: [],
      coachingByDay: { [TODAY]: [swim, gym] },
      matched: [],
    });

    // Assert
    expect(buckets.soloPlans.map((a) => a.id)).toEqual(["a-swim", "a-gym"]);
  });

  it("should select exactly today's slice of the calendar's own bucketing", () => {
    // Arrange
    // A cross-day match — querying the whole week is what makes Today a
    // literal subset of the calendar's per-day output.
    const ms = matched();
    const sharedArgs = {
      days: DAYS,
      coachingByDay: { [TODAY]: [activity()] },
      workoutsByDay: { [TODAY]: [workout()] },
      matched: [ms],
    };

    // Act
    const calendar = buildCalendarBuckets(sharedArgs);
    const today = buildTodayBuckets({
      dayIsos: DAYS,
      todayIso: TODAY,
      weekWorkouts: [workout()],
      coachingByDay: { [TODAY]: [activity()] },
      matched: [ms],
    });

    // Assert
    expect(today.matchedSessions).toEqual(calendar.matchedByDay[TODAY]);
    expect(today.soloPlans).toEqual(calendar.soloPlansByDay[TODAY]);
    expect(today.soloActuals).toEqual(calendar.soloActualsByDay[TODAY]);
  });

  it("should not be empty when a coaching activity is absorbed into a match", () => {
    // Arrange
    const ms = matched();

    // Act
    const buckets = buildTodayBuckets({
      dayIsos: DAYS,
      todayIso: TODAY,
      weekWorkouts: [workout()],
      coachingByDay: { [TODAY]: [activity()] },
      matched: [ms],
    });

    // Assert
    expect(todayBucketsEmpty(buckets)).toBe(false);
    expect(buckets.matchedSessions).toHaveLength(1);
    expect(buckets.soloPlans).toHaveLength(0);
    expect(buckets.soloActuals).toHaveLength(0);
  });

  it("should report empty when no source has an entry for today", () => {
    // Arrange
    const otherDay = activity({ id: "a-other", date: "2026-04-27" });

    // Act
    const buckets = buildTodayBuckets({
      dayIsos: DAYS,
      todayIso: TODAY,
      weekWorkouts: [],
      coachingByDay: { "2026-04-27": [otherDay] },
      matched: [],
    });

    // Assert
    expect(todayBucketsEmpty(buckets)).toBe(true);
  });
});
