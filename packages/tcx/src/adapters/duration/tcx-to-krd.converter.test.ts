import { describe, expect, it } from "vitest";
import { convertTcxDuration } from "./tcx-to-krd.converter";

describe("convertTcxDuration (tcx-to-krd.converter)", () => {
  it("should convert Time duration with seconds", () => {
    const result = convertTcxDuration({
      durationType: "Time",
      seconds: 300,
    });

    expect(result).toStrictEqual({
      duration: { type: "time", seconds: 300 },
    });
  });

  it("should convert Distance duration with meters", () => {
    const result = convertTcxDuration({
      durationType: "Distance",
      meters: 1000,
    });

    expect(result).toStrictEqual({
      duration: { type: "distance", meters: 1000 },
    });
  });

  it("should convert LapButton to open", () => {
    const result = convertTcxDuration({
      durationType: "LapButton",
    });

    expect(result).toStrictEqual({
      duration: { type: "open" },
    });
  });

  it("should convert HeartRateAbove with bpm to extensions", () => {
    const result = convertTcxDuration({
      durationType: "HeartRateAbove",
      bpm: 160,
    });

    expect(result).toStrictEqual({
      duration: { type: "open" },
      extensions: { heartRateAbove: 160 },
    });
  });

  it("should convert HeartRateBelow with bpm to extensions", () => {
    const result = convertTcxDuration({
      durationType: "HeartRateBelow",
      bpm: 120,
    });

    expect(result).toStrictEqual({
      duration: { type: "open" },
      extensions: { heartRateBelow: 120 },
    });
  });

  it("should convert CaloriesBurned with calories to extensions", () => {
    const result = convertTcxDuration({
      durationType: "CaloriesBurned",
      calories: 500,
    });

    expect(result).toStrictEqual({
      duration: { type: "open" },
      extensions: { caloriesBurned: 500 },
    });
  });

  it("should return open for invalid duration type", () => {
    const result = convertTcxDuration({
      durationType: "InvalidType",
    });

    expect(result).toStrictEqual({
      duration: { type: "open" },
    });
  });

  it("should return open for missing duration type", () => {
    const result = convertTcxDuration({});

    expect(result).toStrictEqual({
      duration: { type: "open" },
    });
  });

  it("should return open for Time without seconds (falls through standard)", () => {
    const result = convertTcxDuration({
      durationType: "Time",
    });

    expect(result).toStrictEqual({
      duration: { type: "open" },
    });
  });

  it("should return open for Distance without meters", () => {
    const result = convertTcxDuration({
      durationType: "Distance",
    });

    expect(result).toStrictEqual({
      duration: { type: "open" },
    });
  });

  it("should return open for HeartRateAbove without bpm", () => {
    const result = convertTcxDuration({
      durationType: "HeartRateAbove",
    });

    expect(result).toStrictEqual({
      duration: { type: "open" },
    });
  });

  it("should return open for CaloriesBurned without calories", () => {
    const result = convertTcxDuration({
      durationType: "CaloriesBurned",
    });

    expect(result).toStrictEqual({
      duration: { type: "open" },
    });
  });

  it("should handle zero seconds for Time", () => {
    const result = convertTcxDuration({
      durationType: "Time",
      seconds: 0,
    });

    expect(result).toStrictEqual({
      duration: { type: "time", seconds: 0 },
    });
  });

  it("should handle fractional meters for Distance", () => {
    const result = convertTcxDuration({
      durationType: "Distance",
      meters: 1609.34,
    });

    expect(result).toStrictEqual({
      duration: { type: "distance", meters: 1609.34 },
    });
  });

  it("should handle large calorie values", () => {
    const result = convertTcxDuration({
      durationType: "CaloriesBurned",
      calories: 2000,
    });

    expect(result).toStrictEqual({
      duration: { type: "open" },
      extensions: { caloriesBurned: 2000 },
    });
  });
});
