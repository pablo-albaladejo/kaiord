import { describe, expect, it } from "vitest";
import { convertExtendedDuration } from "./extended-duration.converter";
import type { TcxDurationType } from "../schemas/tcx-duration";

describe("convertExtendedDuration", () => {
  it("should convert HeartRateAbove with bpm", () => {
    const result = convertExtendedDuration(
      "HeartRateAbove" as TcxDurationType,
      { bpm: 160 }
    );

    expect(result).toStrictEqual({
      duration: { type: "open" },
      extensions: { heartRateAbove: 160 },
    });
  });

  it("should convert HeartRateBelow with bpm", () => {
    const result = convertExtendedDuration(
      "HeartRateBelow" as TcxDurationType,
      { bpm: 120 }
    );

    expect(result).toStrictEqual({
      duration: { type: "open" },
      extensions: { heartRateBelow: 120 },
    });
  });

  it("should convert CaloriesBurned with calories", () => {
    const result = convertExtendedDuration(
      "CaloriesBurned" as TcxDurationType,
      { calories: 500 }
    );

    expect(result).toStrictEqual({
      duration: { type: "open" },
      extensions: { caloriesBurned: 500 },
    });
  });

  it("should return null for HeartRateAbove without bpm", () => {
    const result = convertExtendedDuration(
      "HeartRateAbove" as TcxDurationType,
      {}
    );

    expect(result).toBeNull();
  });

  it("should return null for HeartRateBelow without bpm", () => {
    const result = convertExtendedDuration(
      "HeartRateBelow" as TcxDurationType,
      {}
    );

    expect(result).toBeNull();
  });

  it("should return null for CaloriesBurned without calories", () => {
    const result = convertExtendedDuration(
      "CaloriesBurned" as TcxDurationType,
      {}
    );

    expect(result).toBeNull();
  });

  it("should return null for standard duration type Time", () => {
    const result = convertExtendedDuration("Time" as TcxDurationType, {
      seconds: 300,
    });

    expect(result).toBeNull();
  });

  it("should return null for standard duration type Distance", () => {
    const result = convertExtendedDuration("Distance" as TcxDurationType, {
      meters: 1000,
    });

    expect(result).toBeNull();
  });

  it("should return null for LapButton", () => {
    const result = convertExtendedDuration("LapButton" as TcxDurationType, {});

    expect(result).toBeNull();
  });

  it("should handle large bpm value for HeartRateAbove", () => {
    const result = convertExtendedDuration(
      "HeartRateAbove" as TcxDurationType,
      { bpm: 200 }
    );

    expect(result).toStrictEqual({
      duration: { type: "open" },
      extensions: { heartRateAbove: 200 },
    });
  });

  it("should handle large calorie value", () => {
    const result = convertExtendedDuration(
      "CaloriesBurned" as TcxDurationType,
      { calories: 2000 }
    );

    expect(result).toStrictEqual({
      duration: { type: "open" },
      extensions: { caloriesBurned: 2000 },
    });
  });
});
