import { describe, expect, it } from "vitest";

import {
  rawStep as step,
  rawWorkout,
  valueOf,
} from "../test-utils/raw-workout";
import type { Raw } from "../test-utils/raw-workout";
import { resolveCoachLiterals } from "./resolve-coach-literals";

const run = (...steps: Array<Raw>) => rawWorkout("running", ...steps);
const timed = { type: "time", minutes: 20 };
const FASTEST_SECONDS_PER_KM = 120;
const SLOWEST_SECONDS_PER_KM = 900;
const SECONDS_PER_MINUTE = 60;
const METERS_PER_KM = 1000;
const HALF_SECOND = 0.5;
const paceOf = (value: Raw, duration: Raw = timed) =>
  valueOf(resolveCoachLiterals(run(step(duration, value))));

describe("resolveCoachLiterals: paces", () => {
  it("should turn a pace per kilometre into metres per second", () => {
    // Arrange
    const value = { unit: "pace", per: "km", clock: "4:30" };

    // Act
    const resolved = paceOf(value);

    // Assert
    expect(resolved).toEqual({ unit: "mps", value: 3.704 });
  });

  it("should read the coach's minute and second marks as a clock", () => {
    // Arrange
    const value = { unit: "pace", per: "km", clock: "5'15\"" };

    // Act
    const resolved = paceOf(value);

    // Assert
    expect(resolved).toEqual({ unit: "mps", value: 3.175 });
  });

  it("should turn a pace range into a speed range, slower bound first", () => {
    // Arrange
    const value = { unit: "pace", per: "km", clock: "4:45", clockTo: "4:50" };

    // Act
    const resolved = paceOf(value);

    // Assert
    expect(resolved).toEqual({ unit: "range", min: 3.448, max: 3.509 });
  });

  it("should use the distance the pace is written per", () => {
    // Arrange
    const perMile = { unit: "pace", per: "mi", clock: "7:00" };
    const per100m = { unit: "pace", per: "100m", clock: "1:45" };

    // Act
    const resolved = [paceOf(perMile), paceOf(per100m)];

    // Assert
    expect(resolved).toEqual([
      { unit: "mps", value: 3.832 },
      { unit: "mps", value: 0.952 },
    ]);
  });

  it("should divide the step's distance by the coach's split time", () => {
    // Arrange
    const value = { unit: "split", clock: "3:10" };
    const distance = { type: "distance", meters: 800 };

    // Act
    const resolved = paceOf(value, distance);

    // Assert
    expect(resolved).toEqual({ unit: "mps", value: 4.211 });
  });

  it("should turn km/h and mph into metres per second", () => {
    // Arrange
    const kmh = { unit: "kmh", value: 12 };
    const mphRange = { unit: "mph", min: 6, max: 7 };

    // Act
    const resolved = [paceOf(kmh), paceOf(mphRange)];

    // Assert
    expect(resolved).toEqual([
      { unit: "mps", value: 3.333 },
      { unit: "range", min: 2.682, max: 3.129 },
    ]);
  });

  it("should refuse a split on a step that has no distance", () => {
    // Arrange
    const value = { unit: "split", clock: "3:10" };

    // Act
    const act = () => paceOf(value);

    // Assert
    expect(act).toThrow(/split needs a distance duration/);
  });

  it("should refuse a clock that is not minutes and seconds", () => {
    // Arrange
    const value = { unit: "pace", per: "km", clock: "4:75" };

    // Act
    const act = () => paceOf(value);

    // Assert
    expect(act).toThrow(/"4:75" is not a clock/);
  });

  it("should refuse a pace with no distance it is written per", () => {
    // Arrange
    const value = { unit: "pace", clock: "4:30" };

    // Act
    const act = () => paceOf(value);

    // Assert
    expect(act).toThrow(/per/);
  });

  it("should give a speed whose time over a kilometre is the coach's pace, for every pace from 2:00 to 15:00", () => {
    // Arrange
    const clocks: Array<[string, number]> = [];
    for (let s = FASTEST_SECONDS_PER_KM; s <= SLOWEST_SECONDS_PER_KM; s++)
      clocks.push([
        `${Math.floor(s / SECONDS_PER_MINUTE)}:${String(s % SECONDS_PER_MINUTE).padStart(2, "0")}`,
        s,
      ]);

    // Act
    const speeds = clocks.map(
      ([clock]) =>
        (paceOf({ unit: "pace", per: "km", clock }) as { value: number }).value
    );

    // Assert
    clocks.forEach(([, seconds], i) => {
      expect(Math.abs(METERS_PER_KM / speeds[i]! - seconds)).toBeLessThan(
        HALF_SECOND
      );
      if (i > 0) expect(speeds[i]!).toBeLessThanOrEqual(speeds[i - 1]!);
    });
  });
});
