import { describe, expect, it } from "vitest";

import {
  durationOf,
  rawStep as step,
  rawWorkout,
  stepsOf,
} from "../test-utils/raw-workout";
import type { Raw } from "../test-utils/raw-workout";
import { resolveCoachLiterals } from "./resolve-coach-literals";

const run = (...steps: Array<Raw>) => rawWorkout("running", ...steps);
const TWO_HOURS_IN_MINUTES = 120;
const SECONDS_PER_MINUTE = 60;

describe("resolveCoachLiterals: durations", () => {
  it("should add the coach's hours, minutes and seconds into seconds", () => {
    // Arrange
    const raw = run(step({ type: "time", hours: 1, minutes: 15 }));

    // Act
    const resolved = resolveCoachLiterals(raw);

    // Assert
    expect(durationOf(resolved)).toEqual({ type: "time", seconds: 4500 });
  });

  it("should keep minutes and seconds written together as one duration", () => {
    // Arrange
    const raw = run(step({ type: "time", minutes: 3, seconds: 30 }));

    // Act
    const resolved = resolveCoachLiterals(raw);

    // Assert
    expect(durationOf(resolved)).toEqual({ type: "time", seconds: 210 });
  });

  it("should turn kilometres and miles into metres", () => {
    // Arrange
    const raw = run(
      step({ type: "distance", kilometers: 1.5 }),
      step({ type: "distance", miles: 1 })
    );

    // Act
    const resolved = resolveCoachLiterals(raw);

    // Assert
    expect(stepsOf(resolved).map((s) => s.duration)).toEqual([
      { type: "distance", meters: 1500 },
      { type: "distance", meters: 1609.344 },
    ]);
  });

  it("should leave a duration written in seconds as it is", () => {
    // Arrange
    const raw = run(step({ type: "time", seconds: 90 }));

    // Act
    const resolved = resolveCoachLiterals(raw);

    // Assert
    expect(durationOf(resolved)).toEqual({ type: "time", seconds: 90 });
  });

  it("should give 60 seconds per minute for every minute and second a coach writes", () => {
    // Arrange
    const cases: Array<[number, number]> = [];
    for (let m = 0; m <= TWO_HOURS_IN_MINUTES; m++)
      for (let s = 0; s < SECONDS_PER_MINUTE; s++)
        if (m + s > 0) cases.push([m, s]);
    const expected = cases.map(([m, s]) => m * SECONDS_PER_MINUTE + s);

    // Act
    const seconds = cases.map(
      ([m, s]) =>
        (
          durationOf(
            resolveCoachLiterals(
              run(step({ type: "time", minutes: m, seconds: s }))
            )
          ) as { seconds: number }
        ).seconds
    );

    // Assert
    expect(seconds).toEqual(expected);
  });

  it("should not touch output that is not a workout", () => {
    // Arrange
    const raw = { hello: "world" };

    // Act
    const resolved = resolveCoachLiterals(raw);

    // Assert
    expect(resolved).toBe(raw);
  });
});
