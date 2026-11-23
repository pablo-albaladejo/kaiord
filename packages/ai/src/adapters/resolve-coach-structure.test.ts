import { describe, expect, it } from "vitest";

import {
  rawStep as step,
  rawWorkout,
  stepsOf,
  valueOf,
} from "../test-utils/raw-workout";
import type { Raw } from "../test-utils/raw-workout";
import { resolveCoachLiterals } from "./resolve-coach-literals";

const run = (...steps: Array<Raw>) => rawWorkout("running", ...steps);
const minutes = (n: number) => ({ type: "time", minutes: n });
const FORTY = 40;
const FIVE = 5;
const THREE = 3;
const ONE_HOUR_IN_MINUTES = 60;
const WHOLE_CYCLES_IN_30_MIN_OF_3_30 = 8;

const hrStep = (value: Raw) => ({
  ...step(minutes(FORTY)),
  targetType: "heart_rate",
  target: { type: "heart_rate", value },
});

describe("resolveCoachLiterals: references, heart rate and filled blocks", () => {
  it.each([
    ["threshold", { unit: "zone", value: 4 }],
    ["half_marathon", { unit: "zone", value: 4 }],
    ["marathon", { unit: "zone", value: 3 }],
    ["10k", { unit: "zone", min: 4, max: 5 }],
    ["5k", { unit: "zone", value: 5 }],
  ])("should name the athlete's zone for a pace at %s", (reference, zone) => {
    // Arrange
    const raw = run(step(minutes(FIVE), { unit: "reference", reference }));

    // Act
    const resolved = resolveCoachLiterals(raw);

    // Assert
    expect(valueOf(resolved)).toEqual(zone);
  });

  it("should refuse a reference the code does not know", () => {
    // Arrange
    const raw = run(
      step(minutes(FIVE), { unit: "reference", reference: "mile" })
    );

    // Act
    const act = () => resolveCoachLiterals(raw);

    // Assert
    expect(act).toThrow(/step 0: reference "mile" is not one of/);
  });

  it("should give the midpoint of a % max heart-rate range", () => {
    // Arrange
    const raw = run(hrStep({ unit: "percent_max", min: 75, max: 80 }));

    // Act
    const resolved = resolveCoachLiterals(raw);

    // Assert
    expect(valueOf(resolved)).toEqual({ unit: "percent_max", value: 77.5 });
  });

  it("should count the whole cycles that fit in a block's total time", () => {
    // Arrange
    const raw = run({
      fill: { type: "time", minutes: 30 },
      steps: [
        step(minutes(1)),
        step({ type: "time", minutes: 2, seconds: 30 }),
      ],
    });

    // Act
    const resolved = resolveCoachLiterals(raw);

    // Assert
    const block = stepsOf(resolved)[0]!;
    expect(block.repeatCount).toBe(WHOLE_CYCLES_IN_30_MIN_OF_3_30);
    expect(block).not.toHaveProperty("fill");
  });

  it("should refuse a filled block whose cycle has a step without a time", () => {
    // Arrange
    const raw = run({
      fill: { type: "time", minutes: 30 },
      steps: [step({ type: "distance", meters: 400 }), step(minutes(1))],
    });

    // Act
    const act = () => resolveCoachLiterals(raw);

    // Assert
    expect(act).toThrow(/fill needs every step of the block timed/);
  });

  it("should refuse a fill shorter than one cycle", () => {
    // Arrange
    const raw = run({ fill: minutes(2), steps: [step(minutes(THREE))] });

    // Act
    const act = () => resolveCoachLiterals(raw);

    // Assert
    expect(act).toThrow(/shorter than one cycle/);
  });

  it("should never fill past the coach's total, for every total and cycle up to an hour", () => {
    // Arrange
    const cases: Array<[number, number]> = [];
    for (let total = 1; total <= ONE_HOUR_IN_MINUTES; total++)
      for (let cycle = 1; cycle <= total; cycle++) cases.push([total, cycle]);

    // Act
    const counts = cases.map(([total, cycle]) => {
      const raw = run({ fill: minutes(total), steps: [step(minutes(cycle))] });
      return stepsOf(resolveCoachLiterals(raw))[0]!.repeatCount as number;
    });

    // Assert
    cases.forEach(([total, cycle], i) => {
      expect(counts[i]! * cycle).toBeLessThanOrEqual(total);
      expect((counts[i]! + 1) * cycle).toBeGreaterThan(total);
    });
  });
});
