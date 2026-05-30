import { describe, expect, it } from "vitest";

import type { WorkoutRecord } from "../../../types/calendar-record";
import { normaliseLoads, recordLoad, weekLoadFractions } from "./today-load";

const RAW_FALLBACK_LOAD = 30;
const MIN_BAR_FRACTION = 0.12;
const FULL = 1;
const MID_LOAD = 50;
const PEAK_LOAD = 100;
const HIGH_LOAD = 1000;
const TINY_LOAD = 1;

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
