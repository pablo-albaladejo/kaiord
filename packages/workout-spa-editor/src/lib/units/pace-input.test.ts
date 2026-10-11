import { describe, expect, it } from "vitest";

import {
  mpsToPaceSeconds,
  paceInputBase,
  paceInputSuffix,
  paceSecondsToMps,
} from "./pace-input";

const PACE_430 = 270;
const MPS_430 = 3.704;

describe("paceInputBase", () => {
  it("should pace runs per km, or per mile in imperial", () => {
    // Arrange

    // Act
    const bases = [
      paceInputBase("running", "metric"),
      paceInputBase("running", "imperial"),
    ];

    // Assert
    expect(bases).toEqual(["km", "mi"]);
  });

  it("should pace swims per 100 m, or per 100 yd in imperial", () => {
    // Arrange

    // Act
    const bases = [
      paceInputBase("swimming", "metric"),
      paceInputBase("swimming", "imperial"),
    ];

    // Assert
    expect(bases).toEqual(["100m", "100yd"]);
    expect(paceInputSuffix("100m")).toBe("min/100 m");
  });
});

describe("pace conversion", () => {
  it("should turn 4:30 min/km into m/s, rounded to the millimetre", () => {
    // Arrange

    // Act
    const mps = paceSecondsToMps(PACE_430, "km");

    // Assert
    expect(mps).toBe(MPS_430);
  });

  it("should give back 4:30 min/km from the stored m/s", () => {
    // Arrange
    const mps = paceSecondsToMps(PACE_430, "km");

    // Act
    const seconds = mpsToPaceSeconds(mps, "km");

    // Assert
    expect(Math.round(seconds)).toBe(PACE_430);
  });

  it("should round-trip a swim pace per 100 m", () => {
    // Arrange
    const perHundred = 105;

    // Act
    const back = mpsToPaceSeconds(paceSecondsToMps(perHundred, "100m"), "100m");

    // Assert
    expect(Math.round(back)).toBe(perHundred);
  });
});
