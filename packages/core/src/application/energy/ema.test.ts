import { describe, expect, it } from "vitest";

import { type EmaPoint, exponentialMovingAverage } from "./ema";

const WINDOW_DAYS = 3;
const EMA_NUMERATOR = 2;
const WINDOW_OFFSET = 1;
// alpha = 2 / (3 + 1) = 0.5
const ALPHA = EMA_NUMERATOR / (WINDOW_DAYS + WINDOW_OFFSET);

const V0 = 80;
const V1 = 82;
const V2 = 78;
const V3 = 81;
const FLAT_VALUE = 70;
const STEP_LOW = 0;
const STEP_HIGH = 10;
const FAST_WINDOW = 1;
const SLOW_WINDOW = 9;

const series: EmaPoint[] = [
  { date: "2026-06-01", value: V0 },
  { date: "2026-06-02", value: V1 },
  { date: "2026-06-03", value: V2 },
  { date: "2026-06-04", value: V3 },
];

describe("exponentialMovingAverage (empty and single)", () => {
  it("should return an empty series for empty input", () => {
    // Arrange
    const points: EmaPoint[] = [];

    // Act
    const result = exponentialMovingAverage(points, {
      windowDays: WINDOW_DAYS,
    });

    // Assert
    expect(result).toEqual([]);
  });

  it("should seed the first ema with the first value", () => {
    // Arrange
    const points: EmaPoint[] = [{ date: "2026-06-01", value: V0 }];

    // Act
    const result = exponentialMovingAverage(points, {
      windowDays: WINDOW_DAYS,
    });

    // Assert
    expect(result).toEqual([{ date: "2026-06-01", ema: V0 }]);
  });
});

describe("exponentialMovingAverage (smoothing)", () => {
  it("should mirror the input length one-to-one", () => {
    // Arrange
    const points = series;

    // Act
    const result = exponentialMovingAverage(points, {
      windowDays: WINDOW_DAYS,
    });

    // Assert
    expect(result).toHaveLength(series.length);
  });

  it("should carry the date through unchanged at each point", () => {
    // Arrange
    const points = series;

    // Act
    const result = exponentialMovingAverage(points, {
      windowDays: WINDOW_DAYS,
    });

    // Assert
    expect(result.map((point) => point.date)).toEqual(
      series.map((point) => point.date)
    );
  });

  it("should compute the running ema with alpha derived from the window", () => {
    // Arrange
    const e0 = V0;
    const e1 = ALPHA * V1 + (1 - ALPHA) * e0;
    const e2 = ALPHA * V2 + (1 - ALPHA) * e1;
    const e3 = ALPHA * V3 + (1 - ALPHA) * e2;

    // Act
    const result = exponentialMovingAverage(series, {
      windowDays: WINDOW_DAYS,
    });

    // Assert
    expect(result.map((point) => point.ema)).toEqual([e0, e1, e2, e3]);
  });

  it("should track a flat series at the constant value", () => {
    // Arrange
    const flat: EmaPoint[] = [
      { date: "2026-06-01", value: FLAT_VALUE },
      { date: "2026-06-02", value: FLAT_VALUE },
      { date: "2026-06-03", value: FLAT_VALUE },
    ];

    // Act
    const result = exponentialMovingAverage(flat, { windowDays: WINDOW_DAYS });

    // Assert
    expect(result.every((point) => point.ema === FLAT_VALUE)).toBe(true);
  });

  it("should react faster with a smaller window (larger alpha)", () => {
    // Arrange
    const step: EmaPoint[] = [
      { date: "2026-06-01", value: STEP_LOW },
      { date: "2026-06-02", value: STEP_HIGH },
    ];

    // Act
    const fast = exponentialMovingAverage(step, { windowDays: FAST_WINDOW });
    const slow = exponentialMovingAverage(step, { windowDays: SLOW_WINDOW });

    // Assert
    expect(fast[1].ema).toBeGreaterThan(slow[1].ema);
  });
});

describe("exponentialMovingAverage (guards)", () => {
  it("should throw for a non-positive window", () => {
    // Arrange
    const points = series;

    // Act
    const act = () =>
      exponentialMovingAverage(points, { windowDays: STEP_LOW });

    // Assert
    expect(act).toThrow(RangeError);
  });

  it("should throw for a non-finite window", () => {
    // Arrange
    const points = series;

    // Act
    const act = () =>
      exponentialMovingAverage(points, { windowDays: Number.NaN });

    // Assert
    expect(act).toThrow(RangeError);
  });

  it("should throw for a non-finite point value", () => {
    // Arrange
    const points: EmaPoint[] = [
      { date: "2026-06-01", value: V0 },
      { date: "2026-06-02", value: Number.NaN },
    ];

    // Act
    const act = () =>
      exponentialMovingAverage(points, { windowDays: WINDOW_DAYS });

    // Assert
    expect(act).toThrow(RangeError);
  });
});
