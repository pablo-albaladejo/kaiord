import { describe, expect, it } from "vitest";

import {
  HOUR_AND_HALF_AS_SEC,
  HOUR_AS_SEC,
  MINUTES_45_AS_SEC,
  TWO_HOURS_AS_SEC,
} from "../test-utils/application-fixtures";
import { parseCoachingDuration } from "./parse-coaching-duration";

describe("parseCoachingDuration", () => {
  it("should parse plain minutes (various spellings)", () => {
    // Arrange

    // Act

    // Assert
    expect(parseCoachingDuration("45 min")).toBe(MINUTES_45_AS_SEC);
    expect(parseCoachingDuration("45min")).toBe(MINUTES_45_AS_SEC);
    expect(parseCoachingDuration("45 minutes")).toBe(MINUTES_45_AS_SEC);
    expect(parseCoachingDuration("45 m")).toBe(MINUTES_45_AS_SEC);
  });

  it("should parse bare hours", () => {
    // Arrange

    // Act

    // Assert
    expect(parseCoachingDuration("1h")).toBe(HOUR_AS_SEC);
    expect(parseCoachingDuration("1 h")).toBe(HOUR_AS_SEC);
    expect(parseCoachingDuration("1 hour")).toBe(HOUR_AS_SEC);
    expect(parseCoachingDuration("2 hours")).toBe(TWO_HOURS_AS_SEC);
  });

  it("should parse hours-and-minutes (both spellings)", () => {
    // Arrange

    // Act

    // Assert
    expect(parseCoachingDuration("1h 30")).toBe(HOUR_AND_HALF_AS_SEC);
    expect(parseCoachingDuration("1h30")).toBe(HOUR_AND_HALF_AS_SEC);
    expect(parseCoachingDuration("1h 30m")).toBe(HOUR_AND_HALF_AS_SEC);
    expect(parseCoachingDuration("1 h 30 min")).toBe(HOUR_AND_HALF_AS_SEC);
  });

  it("should parse cycling apostrophe notation", () => {
    // Arrange

    // Act

    // Assert
    expect(parseCoachingDuration("45'")).toBe(MINUTES_45_AS_SEC);
    expect(parseCoachingDuration("90'")).toBe(HOUR_AND_HALF_AS_SEC);
    expect(parseCoachingDuration("1h 30'")).toBe(HOUR_AND_HALF_AS_SEC);
  });

  it("should parse ISO 8601 durations", () => {
    // Arrange

    // Act

    // Assert
    expect(parseCoachingDuration("PT45M")).toBe(MINUTES_45_AS_SEC);
    expect(parseCoachingDuration("PT1H")).toBe(HOUR_AS_SEC);
    expect(parseCoachingDuration("PT1H30M")).toBe(HOUR_AND_HALF_AS_SEC);
  });

  it("should drop the approximate marker", () => {
    // Arrange

    // Act

    // Assert
    expect(parseCoachingDuration("~45 min")).toBe(MINUTES_45_AS_SEC);
    expect(parseCoachingDuration("~1h 30m")).toBe(HOUR_AND_HALF_AS_SEC);
  });

  it("should use the lower bound for ranges (minutes)", () => {
    // Arrange

    // Act

    // Assert
    expect(parseCoachingDuration("45-50 min")).toBe(MINUTES_45_AS_SEC);
    expect(parseCoachingDuration("60-90min")).toBe(HOUR_AS_SEC);
  });

  it("should use the lower bound for ranges (hours)", () => {
    // Arrange

    // Act

    // Assert
    expect(parseCoachingDuration("1h-1h30")).toBe(HOUR_AS_SEC);
    expect(parseCoachingDuration("1h - 1h30")).toBe(HOUR_AS_SEC);
  });

  it("should return undefined for undefined input", () => {
    // Arrange

    // Act

    // Assert
    expect(parseCoachingDuration(undefined)).toBeUndefined();
  });

  it("should return undefined for empty / whitespace-only input", () => {
    // Arrange

    // Act

    // Assert
    expect(parseCoachingDuration("")).toBeUndefined();
    expect(parseCoachingDuration("   ")).toBeUndefined();
  });

  it("should return undefined for unparseable input", () => {
    // Arrange

    // Act

    // Assert
    expect(parseCoachingDuration("qsdf")).toBeUndefined();
    expect(parseCoachingDuration("abc")).toBeUndefined();
    expect(parseCoachingDuration("?!?")).toBeUndefined();
  });

  it("should return undefined for ISO 8601 range syntax (not supported v1)", () => {
    // Arrange

    // Act

    // Assert
    expect(parseCoachingDuration("PT45M/PT50M")).toBeUndefined();
    expect(parseCoachingDuration("PT45M--PT50M")).toBeUndefined();
  });

  it("should be deterministic for canonical forms", () => {
    // Arrange

    // Act

    // Assert
    expect(parseCoachingDuration("45 min")).toBe(
      parseCoachingDuration("45 min")
    );
    expect(parseCoachingDuration("PT1H30M")).toBe(
      parseCoachingDuration("PT1H30M")
    );
  });
});
