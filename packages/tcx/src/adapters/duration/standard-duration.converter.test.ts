import { describe, expect, it } from "vitest";
import { convertStandardDuration } from "./standard-duration.converter";
import type { TcxDurationType } from "../schemas/tcx-duration";

describe("convertStandardDuration", () => {
  it("should convert Time duration with seconds", () => {
    const result = convertStandardDuration("Time" as TcxDurationType, {
      seconds: 300,
    });

    expect(result).toStrictEqual({
      duration: { type: "time", seconds: 300 },
    });
  });

  it("should convert Distance duration with meters", () => {
    const result = convertStandardDuration("Distance" as TcxDurationType, {
      meters: 1000,
    });

    expect(result).toStrictEqual({
      duration: { type: "distance", meters: 1000 },
    });
  });

  it("should convert LapButton duration to open", () => {
    const result = convertStandardDuration("LapButton" as TcxDurationType, {});

    expect(result).toStrictEqual({
      duration: { type: "open" },
    });
  });

  it("should return null for Time without seconds", () => {
    const result = convertStandardDuration("Time" as TcxDurationType, {});

    expect(result).toBeNull();
  });

  it("should return null for Distance without meters", () => {
    const result = convertStandardDuration("Distance" as TcxDurationType, {});

    expect(result).toBeNull();
  });

  it("should return null for HeartRateAbove (not standard)", () => {
    const result = convertStandardDuration(
      "HeartRateAbove" as TcxDurationType,
      { bpm: 160 }
    );

    expect(result).toBeNull();
  });

  it("should handle fractional seconds", () => {
    const result = convertStandardDuration("Time" as TcxDurationType, {
      seconds: 90.5,
    });

    expect(result).toStrictEqual({
      duration: { type: "time", seconds: 90.5 },
    });
  });

  it("should handle zero seconds", () => {
    const result = convertStandardDuration("Time" as TcxDurationType, {
      seconds: 0,
    });

    expect(result).toStrictEqual({
      duration: { type: "time", seconds: 0 },
    });
  });

  it("should handle zero meters", () => {
    const result = convertStandardDuration("Distance" as TcxDurationType, {
      meters: 0,
    });

    expect(result).toStrictEqual({
      duration: { type: "distance", meters: 0 },
    });
  });
});
