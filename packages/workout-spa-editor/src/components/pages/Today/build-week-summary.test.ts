import { createWorkoutKRD } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import type { MatchedSessionWithMetadata } from "../../../hooks/use-matched-sessions";
import { profileWith } from "../../../lib/athlete/test-profile";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingActivity } from "../../../types/coaching-activity";
import { buildWeekSummary } from "./build-week-summary";

const DAY = "2026-04-29";
const DAYS = ["2026-04-28", DAY, "2026-04-30"];
const STEP_SECONDS = 600;
const FTP_PERCENT = 60;
const FTP_WATTS = 250;
const PROFILE = profileWith("cycling", { ftp: FTP_WATTS });

const activity = (o: Partial<CoachingActivity> = {}): CoachingActivity => ({
  id: "a-1",
  source: "train2go",
  sourceBadge: "T2G",
  date: DAY,
  sport: { label: "Cycling", icon: "bike" },
  title: "Session",
  status: "pending",
  ...o,
});

const rawWorkout = (o: Partial<WorkoutRecord> = {}): WorkoutRecord =>
  ({
    id: "w-raw",
    date: DAY,
    sport: "cycling",
    source: "manual",
    state: "raw",
    krd: null,
    raw: { title: "Ride" },
    ...o,
  }) as WorkoutRecord;

const krdWorkout = (o: Partial<WorkoutRecord> = {}): WorkoutRecord =>
  ({
    ...rawWorkout(),
    id: "w-krd",
    state: "structured",
    krd: createWorkoutKRD({
      sport: "cycling",
      steps: [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: STEP_SECONDS },
          targetType: "power",
          target: {
            type: "power",
            value: { unit: "percent_ftp", value: FTP_PERCENT },
          },
        },
      ],
    }),
    ...o,
  }) as WorkoutRecord;

const NO_MATCHED: MatchedSessionWithMetadata[] = [];

describe("buildWeekSummary", () => {
  it("should bucket a coaching effort as an estimated intensity", () => {
    // Arrange
    const coachingByDay = { [DAY]: [activity({ effort: 4 })] };

    // Act
    const summary = buildWeekSummary({
      dayIsos: DAYS,
      weekWorkouts: [],
      coachingByDay,
      matched: NO_MATCHED,
      profile: PROFILE,
    });

    // Assert
    expect(summary[DAY]).toEqual({
      count: 1,
      intensity: "hard",
      estimated: true,
      sport: "bike",
    });
  });

  it("should map a low coaching effort to easy", () => {
    // Arrange
    const coachingByDay = { [DAY]: [activity({ effort: 1 })] };

    // Act
    const summary = buildWeekSummary({
      dayIsos: DAYS,
      weekWorkouts: [],
      coachingByDay,
      matched: NO_MATCHED,
      profile: PROFILE,
    });

    // Assert
    expect(summary[DAY].intensity).toBe("easy");
  });

  it("should count multiple entries on a day", () => {
    // Arrange
    const coachingByDay = {
      [DAY]: [activity({ id: "a-1" }), activity({ id: "a-2" })],
    };

    // Act
    const summary = buildWeekSummary({
      dayIsos: DAYS,
      weekWorkouts: [],
      coachingByDay,
      matched: NO_MATCHED,
      profile: PROFILE,
    });

    // Assert
    expect(summary[DAY].count).toBe(2);
  });

  it("should mark a KRD workout as measured (not estimated)", () => {
    // Arrange

    // Act
    const summary = buildWeekSummary({
      dayIsos: DAYS,
      weekWorkouts: [krdWorkout()],
      coachingByDay: {},
      matched: NO_MATCHED,
      profile: PROFILE,
    });

    // Assert
    expect(summary[DAY].estimated).toBe(false);
    expect(summary[DAY].intensity).not.toBeNull();
  });

  it("should leave a raw KRD-less workout presence-only", () => {
    // Arrange

    // Act
    const summary = buildWeekSummary({
      dayIsos: DAYS,
      weekWorkouts: [rawWorkout()],
      coachingByDay: {},
      matched: NO_MATCHED,
      profile: PROFILE,
    });

    // Assert
    expect(summary[DAY]).toEqual({
      count: 1,
      intensity: null,
      estimated: false,
      sport: "\u{1F6B4}",
    });
  });

  it("should report an empty day as count 0 with no intensity", () => {
    // Arrange

    // Act
    const summary = buildWeekSummary({
      dayIsos: DAYS,
      weekWorkouts: [],
      coachingByDay: {},
      matched: NO_MATCHED,
      profile: PROFILE,
    });

    // Assert
    expect(summary["2026-04-30"]).toEqual({
      count: 0,
      intensity: null,
      estimated: false,
      sport: null,
    });
  });
});
