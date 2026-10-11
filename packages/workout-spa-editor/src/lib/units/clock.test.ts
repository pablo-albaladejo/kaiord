import { describe, expect, it } from "vitest";

import { formatClock, parseClock } from "./clock";

const THREE_MINUTES = 180;
const HOUR_FIVE_THIRTY = 3930;
const TEN_MINUTES = 600;
const JUST_UNDER_A_MINUTE = 59.6;
const A_MINUTE = 60;
const JUST_OVER_299 = 299.4;
const SECONDS_299 = 299;
const TWO_HOURS_ODD = 7322;
const SAMPLES = [
  JUST_UNDER_A_MINUTE,
  THREE_MINUTES,
  JUST_OVER_299,
  TWO_HOURS_ODD,
];
const ROUNDED = [A_MINUTE, THREE_MINUTES, SECONDS_299, TWO_HOURS_ODD];

describe("parseClock", () => {
  it("should read m:ss as seconds", () => {
    // Arrange
    const typed = "3:00";

    // Act
    const seconds = parseClock(typed);

    // Assert
    expect(seconds).toBe(THREE_MINUTES);
  });

  it("should read h:mm:ss as seconds", () => {
    // Arrange
    const typed = "1:05:30";

    // Act
    const seconds = parseClock(typed);

    // Assert
    expect(seconds).toBe(HOUR_FIVE_THIRTY);
  });

  it("should read a bare number as whole minutes", () => {
    // Arrange
    const typed = " 10 ";

    // Act
    const seconds = parseClock(typed);

    // Assert
    expect(seconds).toBe(TEN_MINUTES);
  });

  it("should reject seconds past 59 and anything that is not a clock", () => {
    // Arrange
    const typed = ["4:75", "abc", "", "4:5", "-1:00", "1.5"];

    // Act
    const parsed = typed.map(parseClock);

    // Assert
    expect(parsed).toEqual([null, null, null, null, null, null]);
  });
});

describe("formatClock", () => {
  it("should write minutes and zero-padded seconds", () => {
    // Arrange
    const seconds = 270;

    // Act
    const text = formatClock(seconds);

    // Assert
    expect(text).toBe("4:30");
  });

  it("should add hours from one hour on", () => {
    // Arrange
    const seconds = HOUR_FIVE_THIRTY;

    // Act
    const text = formatClock(seconds);

    // Assert
    expect(text).toBe("1:05:30");
  });

  it("should round to the nearest second and survive a round trip", () => {
    // Arrange
    const samples = SAMPLES;

    // Act
    const trips = samples.map((s) => parseClock(formatClock(s)));

    // Assert
    expect(trips).toEqual(ROUNDED);
  });
});
