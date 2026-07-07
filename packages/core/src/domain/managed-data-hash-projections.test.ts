import { describe, expect, it } from "vitest";

import {
  activityHashProjection,
  bodyCompositionHashProjection,
  dailyWellnessHashProjection,
  hrvHashProjection,
  plannedSessionHashProjection,
  sleepHashProjection,
  weightHashProjection,
} from "./managed-data-hash-projections";

describe("managed-data hash projections", () => {
  it("should project a weight payload to kg + measuredAt only", () => {
    // Arrange
    const payload = {
      weightKilograms: 72.5,
      measuredAt: "2026-01-01T06:00:00.000Z",
      source: "garmin",
    };

    // Act
    const projected = weightHashProjection(payload);

    // Assert
    expect(projected).toEqual({
      kg: 72.5,
      measuredAt: "2026-01-01T06:00:00.000Z",
    });
  });

  it("should project a sleep payload to total duration + start time", () => {
    // Arrange
    const payload = {
      totalDurationSeconds: 28_800,
      startTime: "2026-01-01T23:00:00.000Z",
      efficiency: 0.9,
    };

    // Act
    const projected = sleepHashProjection(payload);

    // Assert
    expect(projected).toEqual({
      totalMinutes: 28_800,
      startedAt: "2026-01-01T23:00:00.000Z",
    });
  });

  it("should project an hrv payload to rMSSD + measuredAt", () => {
    // Arrange
    const payload = { rMSSD: 45, measuredAt: "2026-01-01T05:30:00.000Z" };

    // Act
    const projected = hrvHashProjection(payload);

    // Assert
    expect(projected).toEqual({
      rMSSD: 45,
      measuredAt: "2026-01-01T05:30:00.000Z",
    });
  });

  it("should project a daily-wellness payload to steps + date", () => {
    // Arrange
    const payload = { steps: 10_000, date: "2026-01-01", restingHr: 52 };

    // Act
    const projected = dailyWellnessHashProjection(payload);

    // Assert
    expect(projected).toEqual({ steps: 10_000, date: "2026-01-01" });
  });

  it("should project a body-composition payload to body-fat + measuredAt", () => {
    // Arrange
    const payload = {
      bodyFatPercent: 18.2,
      measuredAt: "2026-01-01T06:00:00.000Z",
      muscleMassKg: 34,
    };

    // Act
    const projected = bodyCompositionHashProjection(payload);

    // Assert
    expect(projected).toEqual({
      bodyFatPercent: 18.2,
      measuredAt: "2026-01-01T06:00:00.000Z",
    });
  });

  it("should project a planned-session payload to source, sourceId, and date", () => {
    // Arrange
    // snake_case `source_id` maps to camelCase `sourceId`.
    const payload = {
      source: "train2go",
      source_id: "session-42",
      date: "2026-01-01",
      title: "Sweet spot intervals",
    };

    // Act
    const projected = plannedSessionHashProjection(payload);

    // Assert
    expect(projected).toEqual({
      source: "train2go",
      sourceId: "session-42",
      date: "2026-01-01",
    });
  });

  it("should project an activity payload from its nested summary", () => {
    // Arrange
    const payload = {
      summary: {
        source: "garmin",
        source_id: "act-99",
        start_time: "2026-01-01T07:00:00.000Z",
      },
      laps: [{ distance: 1000 }],
    };

    // Act
    const projected = activityHashProjection(payload);

    // Assert
    expect(projected).toEqual({
      source: "garmin",
      sourceId: "act-99",
      startTime: "2026-01-01T07:00:00.000Z",
    });
  });

  it("should fall back to undefined identity fields when activity summary is absent", () => {
    // Arrange
    const payload = { laps: [] };

    // Act
    const projected = activityHashProjection(payload);

    // Assert
    expect(projected).toEqual({
      source: undefined,
      sourceId: undefined,
      startTime: undefined,
    });
  });
});
