import { describe, expect, it } from "vitest";

import type { Duration } from "../../domain/schemas/duration";
import type { KRD } from "../../domain/schemas/krd";
import type { Target } from "../../domain/schemas/target";
import type {
  RepetitionBlock,
  WorkoutStep,
} from "../../domain/schemas/workout";
import { createToleranceChecker } from "../../domain/validation/tolerance-checker";
import { createMockLogger } from "../../test-utils/index.js";
import { compareKRDs } from "./compare-krds";

const checker = createToleranceChecker();
const logger = createMockLogger();
const PATH = "structured_workout.steps";
const REPEATS = 3;
const FIVE_MINUTES = 300;
const ONE_SECOND_LONGER = 301;
const TWO_SECONDS_LONGER = 302;
const FTP_85 = 85;
const FTP_87 = 87;
const WATTS_250 = 250;
const WATTS_252 = 252;
const BPM_150 = 150;
const BPM_151 = 151;

const step = (
  duration: Duration,
  target: Target = { type: "open" },
  intensity: WorkoutStep["intensity"] = "active"
): WorkoutStep => ({
  stepIndex: 0,
  durationType: duration.type,
  duration,
  targetType: target.type,
  target,
  intensity,
});

const workout = (steps: Array<WorkoutStep | RepetitionBlock>): KRD => ({
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2025-01-15T10:30:00Z", sport: "cycling" },
  extensions: { structured_workout: { sport: "cycling", steps } },
});

const time = (seconds: number): Duration => ({ type: "time", seconds });
const power = (value: object): Target => ({ type: "power", value }) as Target;

const compare = (a: KRD, b: KRD) => compareKRDs(a, b, checker, logger);

describe("compareKRDs round-trip comparison of structured workout steps", () => {
  it("should report nothing for identical steps and repeat blocks", () => {
    // Arrange
    const steps = [
      step(time(FIVE_MINUTES)),
      {
        repeatCount: REPEATS,
        steps: [step({ type: "distance", meters: 500 })],
      },
    ];

    // Act
    const violations = compare(workout(steps), workout(structuredClone(steps)));

    // Assert
    expect(violations).toStrictEqual([]);
  });

  it("should accept a duration drift within the time tolerance", () => {
    // Arrange
    const a = workout([step(time(FIVE_MINUTES))]);
    const b = workout([step(time(ONE_SECOND_LONGER))]);

    // Act
    const violations = compare(a, b);

    // Assert
    expect(violations).toStrictEqual([]);
  });

  it("should flag a duration drift beyond the time tolerance", () => {
    // Arrange
    const a = workout([step(time(FIVE_MINUTES))]);
    const b = workout([step(time(TWO_SECONDS_LONGER))]);

    // Act
    const violations = compare(a, b);

    // Assert
    expect(violations).toStrictEqual([
      {
        field: `${PATH}[0].duration.seconds`,
        expected: FIVE_MINUTES,
        actual: TWO_SECONDS_LONGER,
        deviation: 2,
        tolerance: 1,
      },
    ]);
  });

  it("should flag a duration that changed type, with both values", () => {
    // Arrange
    const a = workout([step(time(FIVE_MINUTES))]);
    const b = workout([step({ type: "open" })]);

    // Act
    const violations = compare(a, b);

    // Assert
    expect(violations).toStrictEqual([
      {
        field: `${PATH}[0].duration.type`,
        expected: 0,
        actual: 1,
        deviation: 1,
        tolerance: 0,
        expectedValue: "time",
        actualValue: "open",
      },
    ]);
  });

  it("should flag a dropped step as an exact step-count mismatch", () => {
    // Arrange
    const a = workout([step(time(FIVE_MINUTES)), step(time(FIVE_MINUTES))]);
    const b = workout([step(time(FIVE_MINUTES))]);

    // Act
    const violations = compare(a, b);

    // Assert
    expect(violations).toStrictEqual([
      {
        field: `${PATH}.length`,
        expected: 2,
        actual: 1,
        deviation: 1,
        tolerance: 0,
      },
    ]);
  });

  it("should flag a repeat block that lost its count or became a step", () => {
    // Arrange
    const inner = [step(time(FIVE_MINUTES))];
    const a = workout([
      { repeatCount: REPEATS, steps: inner },
      { repeatCount: REPEATS, steps: inner },
    ]);
    const b = workout([{ repeatCount: 1, steps: inner }, inner[0]!]);

    // Act
    const violations = compare(a, b);

    // Assert
    expect(violations.map((v) => v.field)).toStrictEqual([
      `${PATH}[0].repeatCount`,
      `${PATH}[1].kind`,
    ]);
  });

  it("should compare steps nested inside repeat blocks", () => {
    // Arrange
    const a = workout([
      { repeatCount: REPEATS, steps: [step(time(FIVE_MINUTES))] },
    ]);
    const b = workout([
      { repeatCount: REPEATS, steps: [step(time(TWO_SECONDS_LONGER))] },
    ]);

    // Act
    const violations = compare(a, b);

    // Assert
    expect(violations.map((v) => v.field)).toStrictEqual([
      `${PATH}[0].steps[0].duration.seconds`,
    ]);
  });

  it.each([
    [
      { unit: "watts", value: WATTS_250 },
      { unit: "watts", value: WATTS_252 },
    ],
    [
      { unit: "range", min: WATTS_250, max: WATTS_250 },
      { unit: "range", min: WATTS_250, max: WATTS_252 },
    ],
    [
      { unit: "percent_ftp", value: FTP_85 },
      { unit: "percent_ftp", value: FTP_87 },
    ],
    [
      { unit: "zone", value: 3 },
      { unit: "zone", value: 4 },
    ],
  ])(
    "should flag a power target drift beyond tolerance (%o)",
    (value1, value2) => {
      // Arrange
      const a = workout([step(time(FIVE_MINUTES), power(value1))]);
      const b = workout([step(time(FIVE_MINUTES), power(value2))]);

      // Act
      const violations = compare(a, b);

      // Assert
      expect(violations).toHaveLength(1);
    }
  );

  it("should accept a heart-rate target within ±1 bpm", () => {
    // Arrange
    const hr = (value: number): Target => ({
      type: "heart_rate",
      value: { unit: "bpm", value },
    });
    const a = workout([step(time(FIVE_MINUTES), hr(BPM_150))]);
    const b = workout([step(time(FIVE_MINUTES), hr(BPM_151))]);

    // Act
    const violations = compare(a, b);

    // Assert
    expect(violations).toStrictEqual([]);
  });

  it("should flag a target unit change and an intensity change", () => {
    // Arrange
    const a = workout([
      step(time(FIVE_MINUTES), power({ unit: "watts", value: WATTS_250 })),
    ]);
    const b = workout([
      step(
        time(FIVE_MINUTES),
        power({ unit: "percent_ftp", value: FTP_85 }),
        "warmup"
      ),
    ]);

    // Act
    const violations = compare(a, b);

    // Assert
    expect(
      violations.map((v) => [v.field, v.expectedValue, v.actualValue])
    ).toStrictEqual([
      [`${PATH}[0].target.value.unit`, "watts", "percent_ftp"],
      [`${PATH}[0].intensity`, "active", "warmup"],
    ]);
  });

  it("should flag a structured workout lost by the round-trip", () => {
    // Arrange
    const a = workout([step(time(FIVE_MINUTES))]);
    const b: KRD = { ...a, extensions: {} };

    // Act
    const violations = compare(a, b);

    // Assert
    expect(violations).toMatchObject([
      { field: PATH, expectedValue: "present", actualValue: "absent" },
    ]);
  });

  it("should report nothing when neither KRD is a structured workout", () => {
    // Arrange
    const a: KRD = { ...workout([]), extensions: {} };

    // Act
    const violations = compare(a, structuredClone(a));

    // Assert
    expect(violations).toStrictEqual([]);
  });
});
