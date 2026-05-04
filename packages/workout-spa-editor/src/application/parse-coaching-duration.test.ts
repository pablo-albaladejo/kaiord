import { describe, expect, it } from "vitest";

import { parseCoachingDuration } from "./parse-coaching-duration";

describe("parseCoachingDuration", () => {
  it("should parse plain minutes (various spellings)", () => {
    expect(parseCoachingDuration("45 min")).toBe(2700);
    expect(parseCoachingDuration("45min")).toBe(2700);
    expect(parseCoachingDuration("45 minutes")).toBe(2700);
    expect(parseCoachingDuration("45 m")).toBe(2700);
  });

  it("should parse bare hours", () => {
    expect(parseCoachingDuration("1h")).toBe(3600);
    expect(parseCoachingDuration("1 h")).toBe(3600);
    expect(parseCoachingDuration("1 hour")).toBe(3600);
    expect(parseCoachingDuration("2 hours")).toBe(7200);
  });

  it("should parse hours-and-minutes (both spellings)", () => {
    expect(parseCoachingDuration("1h 30")).toBe(5400);
    expect(parseCoachingDuration("1h30")).toBe(5400);
    expect(parseCoachingDuration("1h 30m")).toBe(5400);
    expect(parseCoachingDuration("1 h 30 min")).toBe(5400);
  });

  it("should parse cycling apostrophe notation", () => {
    expect(parseCoachingDuration("45'")).toBe(2700);
    expect(parseCoachingDuration("90'")).toBe(5400);
    expect(parseCoachingDuration("1h 30'")).toBe(5400);
  });

  it("should parse ISO 8601 durations", () => {
    expect(parseCoachingDuration("PT45M")).toBe(2700);
    expect(parseCoachingDuration("PT1H")).toBe(3600);
    expect(parseCoachingDuration("PT1H30M")).toBe(5400);
  });

  it("should drop the approximate marker", () => {
    expect(parseCoachingDuration("~45 min")).toBe(2700);
    expect(parseCoachingDuration("~1h 30m")).toBe(5400);
  });

  it("should use the lower bound for ranges (minutes)", () => {
    expect(parseCoachingDuration("45-50 min")).toBe(2700);
    expect(parseCoachingDuration("60-90min")).toBe(3600);
  });

  it("should use the lower bound for ranges (hours)", () => {
    expect(parseCoachingDuration("1h-1h30")).toBe(3600);
    expect(parseCoachingDuration("1h - 1h30")).toBe(3600);
  });

  it("should return undefined for undefined input", () => {
    expect(parseCoachingDuration(undefined)).toBeUndefined();
  });

  it("should return undefined for empty / whitespace-only input", () => {
    expect(parseCoachingDuration("")).toBeUndefined();
    expect(parseCoachingDuration("   ")).toBeUndefined();
  });

  it("should return undefined for unparseable input", () => {
    expect(parseCoachingDuration("qsdf")).toBeUndefined();
    expect(parseCoachingDuration("abc")).toBeUndefined();
    expect(parseCoachingDuration("?!?")).toBeUndefined();
  });

  it("should return undefined for ISO 8601 range syntax (not supported v1)", () => {
    expect(parseCoachingDuration("PT45M/PT50M")).toBeUndefined();
    expect(parseCoachingDuration("PT45M--PT50M")).toBeUndefined();
  });

  it("should be deterministic for canonical forms", () => {
    expect(parseCoachingDuration("45 min")).toBe(
      parseCoachingDuration("45 min")
    );
    expect(parseCoachingDuration("PT1H30M")).toBe(
      parseCoachingDuration("PT1H30M")
    );
  });
});
