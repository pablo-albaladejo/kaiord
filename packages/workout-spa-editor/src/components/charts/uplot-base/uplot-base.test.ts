import { describe, expect, it } from "vitest";

import {
  EMPTY,
  formatOrEmpty,
  isoDateToSeconds,
  timeXScale,
} from "./uplot-base";

const FINITE = 42;
const SECONDS_2026_03_05 = 1772668800; // 2026-03-05T00:00:00Z / 1000

describe("formatOrEmpty", () => {
  it("should apply the formatter to a finite value", () => {
    // Arrange
    const fmt = (n: number) => `${n} mg/dL`;

    // Act
    const out = formatOrEmpty(FINITE, fmt);

    // Assert
    expect(out).toBe("42 mg/dL");
  });

  it("should return the em-dash placeholder for null", () => {
    // Arrange
    const fmt = (n: number) => `${n}`;

    // Act
    const out = formatOrEmpty(null, fmt);

    // Assert
    expect(out).toBe(EMPTY);
  });

  it("should return the em-dash placeholder for a non-finite number", () => {
    // Arrange
    const fmt = (n: number) => `${n}`;

    // Act
    const out = formatOrEmpty(Number.NaN, fmt);

    // Assert
    expect(out).toBe(EMPTY);
  });
});

describe("timeXScale", () => {
  it("should return a fresh temporal x-scale fragment on each call", () => {
    // Arrange

    // Act
    const a = timeXScale();
    const b = timeXScale();

    // Assert
    expect(a).toEqual({ x: { time: true } });
    expect(a).not.toBe(b);
  });
});

describe("isoDateToSeconds", () => {
  it("should convert a YYYY-MM-DD date to UTC Unix seconds", () => {
    // Arrange
    const date = "2026-03-05";

    // Act
    const seconds = isoDateToSeconds(date);

    // Assert
    expect(seconds).toBe(SECONDS_2026_03_05);
  });

  it("should order two dates ascending by their converted seconds", () => {
    // Arrange
    const earlier = "2026-01-01";
    const later = "2026-12-31";

    // Act
    const delta = isoDateToSeconds(later) - isoDateToSeconds(earlier);

    // Assert
    expect(delta).toBeGreaterThan(0);
  });
});
