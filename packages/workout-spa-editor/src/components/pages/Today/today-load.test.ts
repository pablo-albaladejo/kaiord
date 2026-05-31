import { createWorkoutKRD } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { profileWith } from "../../../lib/athlete/test-profile";
import type { WorkoutRecord } from "../../../types/calendar-record";
import {
  normaliseLoads,
  recordLoad,
  reviewFor,
  weekLoadFractions,
} from "./today-load";

const RAW_FALLBACK_LOAD = 30;
const MIN_BAR_FRACTION = 0.12;
const FULL = 1;
const MID_LOAD = 50;
const PEAK_LOAD = 100;
const HIGH_LOAD = 1000;
const TINY_LOAD = 1;
const STEP_SECONDS = 600;
const FTP_PERCENT = 60;
const FTP_WATTS = 250;

function rawWorkout(date: string): WorkoutRecord {
  return {
    id: `id-${date}`,
    profileId: "p1",
    date,
    sport: "cycling",
    source: "manual",
    sourceId: null,
    planId: null,
    state: "raw",
    raw: null,
    krd: null,
    lastProcessingError: null,
    feedback: null,
    aiMeta: null,
    garminPushId: null,
    tags: [],
    previousState: null,
    createdAt: "2026-05-27T08:00:00.000Z",
    modifiedAt: null,
    updatedAt: "2026-05-27T08:00:00.000Z",
  };
}

describe("normaliseLoads", () => {
  it("should scale loads against the week maximum", () => {
    // Arrange
    const loads = [0, MID_LOAD, PEAK_LOAD];

    // Act
    const fractions = normaliseLoads(loads);

    // Assert
    expect(fractions[0]).toBe(0);
    expect(fractions[2]).toBe(FULL);
  });

  it("should return all zeros when no day has load", () => {
    // Arrange
    const loads = [0, 0, 0];

    // Act
    const fractions = normaliseLoads(loads);

    // Assert
    expect(fractions).toEqual([0, 0, 0]);
  });

  it("should clamp small non-zero loads to a minimum fraction", () => {
    // Arrange
    const loads = [TINY_LOAD, HIGH_LOAD];

    // Act
    const fractions = normaliseLoads(loads);

    // Assert
    expect(fractions[0]).toBe(MIN_BAR_FRACTION);
  });
});

describe("recordLoad", () => {
  it("should use the raw fallback when the record has no KRD", () => {
    // Arrange
    const record = rawWorkout("2026-05-27");

    // Act
    const load = recordLoad(record, null);

    // Assert
    expect(load).toBe(RAW_FALLBACK_LOAD);
  });
});

describe("weekLoadFractions", () => {
  it("should sum per-day loads and normalise across the week", () => {
    // Arrange
    const days = ["2026-05-25", "2026-05-26"];
    const workouts = [rawWorkout("2026-05-26"), rawWorkout("2026-05-26")];

    // Act
    const fractions = weekLoadFractions(days, workouts, null);

    // Assert
    expect(fractions[0]).toBe(0);
    expect(fractions[1]).toBe(FULL);
  });
});

function krdWorkout(date: string): WorkoutRecord {
  return {
    ...rawWorkout(date),
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
  };
}

describe("reviewFor", () => {
  it("should derive a review model from a record with a KRD and profile zones", () => {
    // Arrange
    const record = krdWorkout("2026-05-27");
    const profile = profileWith("cycling", { ftp: FTP_WATTS });

    // Act
    const review = reviewFor(record, profile);

    // Assert
    expect(review).not.toBeNull();
    expect(review?.tss).toBeGreaterThan(0);
  });

  it("should return null when the record has no KRD", () => {
    // Arrange
    const record = rawWorkout("2026-05-27");

    // Act
    const review = reviewFor(record, null);

    // Assert
    expect(review).toBeNull();
  });
});
