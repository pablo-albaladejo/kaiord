import { describe, expect, it } from "vitest";

import { axisTicks, profileTotalSeconds } from "./zone-profile-axis";

const MINUTE = 60;
const QUARTER = 15;
const HALF_HOUR = 30;
const HOUR = 60;
const FULL_PERCENT = 100;
const SHORT_SESSION_MINUTES = 45;
const LONG_SESSION_MINUTES = 180;
const VERY_LONG_SESSION_MINUTES = 300;
const PERCENT_PER_QUARTER = (QUARTER / SHORT_SESSION_MINUTES) * FULL_PERCENT;

const marks = (step: number, total: number): number[] =>
  Array.from({ length: total / step + 1 }, (_, i) => i * step);

describe("axisTicks", () => {
  it("should mark every 15 minutes, placed at their share of the session", () => {
    // Arrange
    const total = SHORT_SESSION_MINUTES * MINUTE;

    // Act
    const ticks = axisTicks(total);

    // Assert
    expect(ticks.map((tick) => tick.minutes)).toEqual(
      marks(QUARTER, SHORT_SESSION_MINUTES)
    );
    ticks.forEach((tick, i) => {
      expect(tick.percent).toBeCloseTo(i * PERCENT_PER_QUARTER);
    });
  });

  it("should widen the spacing so a long session keeps a readable axis", () => {
    // Arrange
    const long = LONG_SESSION_MINUTES * MINUTE;
    const veryLong = VERY_LONG_SESSION_MINUTES * MINUTE;

    // Act
    const longTicks = axisTicks(long).map((tick) => tick.minutes);
    const veryLongTicks = axisTicks(veryLong).map((tick) => tick.minutes);

    // Assert
    expect(longTicks).toEqual(marks(HALF_HOUR, LONG_SESSION_MINUTES));
    expect(veryLongTicks).toEqual(marks(HOUR, VERY_LONG_SESSION_MINUTES));
  });

  it("should return no ticks for an empty session", () => {
    // Arrange

    // Act
    const ticks = axisTicks(0);

    // Assert
    expect(ticks).toEqual([]);
  });
});

describe("profileTotalSeconds", () => {
  it("should sum every segment's seconds", () => {
    // Arrange
    const segments = [
      { zone: 1, seconds: MINUTE },
      { zone: 4, seconds: QUARTER * MINUTE },
    ] as const;

    // Act
    const total = profileTotalSeconds(segments);

    // Assert
    expect(total).toBe(MINUTE + QUARTER * MINUTE);
  });
});
