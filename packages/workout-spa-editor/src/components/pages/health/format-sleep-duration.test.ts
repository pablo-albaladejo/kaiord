import { describe, expect, it } from "vitest";

import {
  SLEEP_BAR_FULL_SECONDS,
  sleepBarPercent,
  sleepDurationParts,
} from "./format-sleep-duration";

const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_MINUTE = 60;
const HOURS = 7;
const MINUTES = 24;
const SEVEN_H_24_M = HOURS * SECONDS_PER_HOUR + MINUTES * SECONDS_PER_MINUTE;
const ALMOST_ANOTHER_MINUTE = 59;
const FULL_PERCENT = 100;
const HALF = 2;

describe("sleepDurationParts", () => {
  it("should split seconds into whole hours and remaining minutes", () => {
    // Arrange
    const totalSeconds = SEVEN_H_24_M;

    // Act
    const parts = sleepDurationParts(totalSeconds);

    // Assert
    expect(parts).toEqual({ hours: HOURS, minutes: MINUTES });
  });

  it("should drop the trailing seconds rather than round the minute up", () => {
    // Arrange
    const totalSeconds = SEVEN_H_24_M + ALMOST_ANOTHER_MINUTE;

    // Act
    const parts = sleepDurationParts(totalSeconds);

    // Assert
    expect(parts).toEqual({ hours: HOURS, minutes: MINUTES });
  });

  it("should clamp a negative or non-finite total to zero", () => {
    // Arrange
    const inputs = [-1, Number.NaN, Number.POSITIVE_INFINITY];

    // Act
    const parts = inputs.map(sleepDurationParts);

    // Assert
    expect(parts).toEqual([
      { hours: 0, minutes: 0 },
      { hours: 0, minutes: 0 },
      { hours: 0, minutes: 0 },
    ]);
  });
});

describe("sleepBarPercent", () => {
  it("should scale a night against a full night rather than against its peers", () => {
    // Arrange
    const totalSeconds = SLEEP_BAR_FULL_SECONDS / HALF;

    // Act
    const percent = sleepBarPercent(totalSeconds);

    // Assert
    expect(percent).toBeCloseTo(FULL_PERCENT / HALF);
  });

  it("should clamp a night longer than the full-night reference", () => {
    // Arrange
    const totalSeconds = SLEEP_BAR_FULL_SECONDS * HALF;

    // Act
    const percent = sleepBarPercent(totalSeconds);

    // Assert
    expect(percent).toBe(FULL_PERCENT);
  });

  it("should render an empty bar for a zero or non-finite total", () => {
    // Arrange
    const inputs = [0, -1, Number.NaN];

    // Act
    const percents = inputs.map(sleepBarPercent);

    // Assert
    expect(percents).toEqual([0, 0, 0]);
  });
});
