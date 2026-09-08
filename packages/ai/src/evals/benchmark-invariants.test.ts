import { describe, expect, it } from "vitest";

import benchmarks from "./benchmarks.json";
import {
  benchmarkViolations,
  zoneCheckViolation,
} from "./benchmark-invariants";
import type { Benchmark } from "./types";

const FIXTURE = benchmarks as Benchmark[];

describe("zoneCheckViolation", () => {
  it.each([
    {
      label: "both bounds",
      zc: { targetType: "power", minValue: 88, maxValue: 93 },
    },
    {
      label: "only a usable minimum",
      zc: { targetType: "heart_rate", minValue: 120 },
    },
  ])("should accept a zone check declaring $label", ({ zc }) => {
    // Arrange

    // Act
    const violation = zoneCheckViolation(zc);

    // Assert
    expect(violation).toBeNull();
  });

  it("should reject a zone check declaring no bound at all", () => {
    // Arrange
    const zc = { targetType: "power" };

    // Act
    const violation = zoneCheckViolation(zc);

    // Assert
    expect(violation).toContain("no bound");
  });

  it.each([
    {
      label: "a minimum of zero, which no target can fall below",
      zc: { targetType: "power", minValue: 0 },
    },
    {
      label: "a maximum of zero, which every target exceeds",
      zc: { targetType: "power", maxValue: 0 },
    },
  ])("should reject $label", ({ zc }) => {
    // Arrange

    // Act
    const violation = zoneCheckViolation(zc);

    // Assert
    expect(violation).toContain("cannot use");
  });

  it("should reject a non-finite bound", () => {
    // Arrange
    const zc = { targetType: "power", maxValue: Number.NaN };

    // Act
    const violation = zoneCheckViolation(zc);

    // Assert
    expect(violation).not.toBeNull();
  });
});

describe("benchmarks.json", () => {
  it("should declare a usable bound on every zone check", () => {
    // Arrange
    const fixture = FIXTURE;

    // Act
    const violations = benchmarkViolations(fixture);

    // Assert
    expect(violations).toEqual([]);
  });

  it("should ignore benchmarks that declare no zone check", () => {
    // Arrange
    const withoutZones = FIXTURE.filter((b) => !b.zoneCheck);

    // Act
    const violations = benchmarkViolations(withoutZones);

    // Assert
    expect(violations).toEqual([]);
  });
});
