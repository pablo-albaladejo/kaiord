import { describe, expect, it } from "vitest";

import { validateSanity } from "./sanity-checks";

const ONE_HOUR_SECONDS = 3600;

const STEP_COUNT_FIVE = 5;

const STEP_COUNT_THREE = 3;

const OVER_STEP_LIMIT = 201;

const SHORT_DURATION_S = 30;

const EXCESSIVE_DURATION_S = 30000;
import { makeValidKrd } from "./test-helpers";

describe("validateSanity", () => {
  it("should return null for valid KRD", () => {
    // Arrange
    const krd = makeValidKrd(STEP_COUNT_FIVE, ONE_HOUR_SECONDS);

    // Act
    const result = validateSanity(krd);

    // Assert
    expect(result).toBeNull();
  });

  it("should reject zero steps", () => {
    // Arrange
    const krd = makeValidKrd(0, ONE_HOUR_SECONDS);

    // Act
    const result = validateSanity(krd);

    // Assert
    expect(result).toContain("Step count 0");
  });

  it("should reject more than 200 steps", () => {
    // Arrange
    const krd = makeValidKrd(OVER_STEP_LIMIT, ONE_HOUR_SECONDS);

    // Act
    const result = validateSanity(krd);

    // Assert
    expect(result).toContain("Step count 201");
  });

  it("should reject duration under 1 minute", () => {
    // Arrange
    const krd = makeValidKrd(STEP_COUNT_THREE, SHORT_DURATION_S);

    // Act
    const result = validateSanity(krd);

    // Assert
    expect(result).toContain("Duration 30s");
  });

  it("should reject duration over 8 hours", () => {
    // Arrange
    const krd = makeValidKrd(STEP_COUNT_THREE, EXCESSIVE_DURATION_S);

    // Act
    const result = validateSanity(krd);

    // Assert
    expect(result).toContain("Duration 30000s");
  });

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
