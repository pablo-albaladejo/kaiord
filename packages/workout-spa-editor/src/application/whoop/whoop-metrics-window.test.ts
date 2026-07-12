import { describe, expect, it } from "vitest";

import { buildMetricsPath, eachCalendarDay } from "./whoop-metrics-window";

const USER_ID = 1629599351;
const STEP_SECONDS = 6;

describe("eachCalendarDay", () => {
  it("should return one day when start and end fall on the same calendar day", () => {
    // Arrange
    const start = "2026-07-10T05:00:00.000Z";
    const end = "2026-07-10T20:00:00.000Z";

    // Act
    const days = eachCalendarDay(start, end);

    // Assert
    expect(days).toEqual([
      {
        date: "2026-07-10",
        dayStartISO: "2026-07-10T00:00:00.000Z",
        dayEndISO: "2026-07-11T00:00:00.000Z",
      },
    ]);
  });

  it("should return one entry per calendar day across a multi-day window", () => {
    // Arrange
    const start = "2026-07-10T22:00:00.000Z";
    const end = "2026-07-12T01:00:00.000Z";

    // Act
    const days = eachCalendarDay(start, end);

    // Assert
    expect(days.map((d) => d.date)).toEqual([
      "2026-07-10",
      "2026-07-11",
      "2026-07-12",
    ]);
  });

  it("should return an empty array when the bounds are not parseable", () => {
    // Arrange
    const start = "not-a-date";
    const end = "also-not-a-date";

    // Act
    const days = eachCalendarDay(start, end);

    // Assert
    expect(days).toEqual([]);
  });

  it("should return an empty array when start is after end", () => {
    // Arrange
    const start = "2026-07-12T00:00:00.000Z";
    const end = "2026-07-10T00:00:00.000Z";

    // Act
    const days = eachCalendarDay(start, end);

    // Assert
    expect(days).toEqual([]);
  });
});

describe("buildMetricsPath", () => {
  it("should build the metrics path with name, start, end, and step", () => {
    // Arrange
    const day = {
      date: "2026-07-10",
      dayStartISO: "2026-07-10T00:00:00.000Z",
      dayEndISO: "2026-07-11T00:00:00.000Z",
    };

    // Act
    const path = buildMetricsPath(USER_ID, day, STEP_SECONDS);

    // Assert
    expect(path).toBe(
      `/metrics-service/v1/metrics/user/${USER_ID}?name=heart_rate` +
        `&start=${encodeURIComponent(day.dayStartISO)}` +
        `&end=${encodeURIComponent(day.dayEndISO)}` +
        `&step=${STEP_SECONDS}`
    );
  });
});
