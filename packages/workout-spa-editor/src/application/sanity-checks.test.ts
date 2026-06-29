import { describe, expect, it } from "vitest";

import { validateSanity } from "./sanity-checks";
import { makeValidKrd } from "./test-helpers";

const ONE_HOUR_SECONDS = 3600;

const STEP_COUNT_FIVE = 5;

const STEP_COUNT_THREE = 3;

const OVER_STEP_LIMIT = 201;

const SHORT_DURATION_S = 30;

const EXCESSIVE_DURATION_S = 30000;

describe("validateSanity", () => {
  it("should return null for valid KRD", () => {
    // Arrange
    const krd = makeValidKrd(STEP_COUNT_FIVE, ONE_HOUR_SECONDS);

    // Act
    const result = validateSanity(krd);

    // Assert
    expect(result).toBeNull();
  });

  it.each([
    { steps: 0, dur: ONE_HOUR_SECONDS, contains: "Step count 0" },
    {
      steps: OVER_STEP_LIMIT,
      dur: ONE_HOUR_SECONDS,
      contains: "Step count 201",
    },
    {
      steps: STEP_COUNT_THREE,
      dur: SHORT_DURATION_S,
      contains: "Duration 30s",
    },
    {
      steps: STEP_COUNT_THREE,
      dur: EXCESSIVE_DURATION_S,
      contains: "Duration 30000s",
    },
  ])(
    "should reject an out-of-range KRD ($contains)",
    ({ steps, dur, contains }) => {
      // Arrange
      const krd = makeValidKrd(steps, dur);

      // Act
      const result = validateSanity(krd);

      // Assert
      expect(result).toContain(contains);
    }
  );

  it("should accept KRD without structured_workout extension", () => {
    // Arrange
    const krd = makeValidKrd();
    delete krd.extensions;

    // Act
    const result = validateSanity(krd);

    // Assert
    expect(result).toBeNull();
  });

  it("should accept KRD with no steps array", () => {
    // Arrange
    const krd = makeValidKrd();
    const ext = krd.extensions!["structured_workout"] as Record<
      string,
      unknown
    >;
    delete ext["steps"];

    // Act
    const result = validateSanity(krd);

    // Assert
    expect(result).toBeNull();
  });

  it("should accept KRD with no estimatedDuration", () => {
    // Arrange
    const krd = makeValidKrd();
    const ext = krd.extensions!["structured_workout"] as Record<
      string,
      unknown
    >;
    delete ext["estimatedDuration"];

    // Act
    const result = validateSanity(krd);

    // Assert
    expect(result).toBeNull();
  });
});
