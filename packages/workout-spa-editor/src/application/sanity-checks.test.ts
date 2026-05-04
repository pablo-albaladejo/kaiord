import { describe, expect, it } from "vitest";

import { validateSanity } from "./sanity-checks";
import { makeValidKrd } from "./test-helpers";

describe("validateSanity", () => {
  it("should return null for valid KRD", () => {
    // Arrange
    const krd = makeValidKrd(5, 3600);

    // Act
    const result = validateSanity(krd);

    // Assert
    expect(result).toBeNull();
  });

  it("should reject zero steps", () => {
    // Arrange
    const krd = makeValidKrd(0, 3600);

    // Act
    const result = validateSanity(krd);

    // Assert
    expect(result).toContain("Step count 0");
  });

  it("should reject more than 200 steps", () => {
    // Arrange
    const krd = makeValidKrd(201, 3600);

    // Act
    const result = validateSanity(krd);

    // Assert
    expect(result).toContain("Step count 201");
  });

  it("should reject duration under 1 minute", () => {
    // Arrange
    const krd = makeValidKrd(3, 30);

    // Act
    const result = validateSanity(krd);

    // Assert
    expect(result).toContain("Duration 30s");
  });

  it("should reject duration over 8 hours", () => {
    // Arrange
    const krd = makeValidKrd(3, 30000);

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
