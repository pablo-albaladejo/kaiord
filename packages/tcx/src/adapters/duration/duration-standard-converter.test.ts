import { describe, expect, it } from "vitest";
import { convertStandardTcxDuration } from "./duration-standard-converter";

describe("convertStandardTcxDuration", () => {
  it("should convert Time_t to time duration", () => {
    const tcxDuration = { "@_xsi:type": "Time_t", Seconds: 300 };

    const result = convertStandardTcxDuration(tcxDuration);

    expect(result).toStrictEqual({ type: "time", seconds: 300 });
  });

  it("should convert Distance_t to distance duration", () => {
    const tcxDuration = { "@_xsi:type": "Distance_t", Meters: 1000 };

    const result = convertStandardTcxDuration(tcxDuration);

    expect(result).toStrictEqual({ type: "distance", meters: 1000 });
  });

  it("should convert LapButton_t to open duration", () => {
    const tcxDuration = { "@_xsi:type": "LapButton_t" };

    const result = convertStandardTcxDuration(tcxDuration);

    expect(result).toStrictEqual({ type: "open" });
  });

  it("should return null for unknown duration type", () => {
    const tcxDuration = { "@_xsi:type": "HeartRateAbove_t" };

    const result = convertStandardTcxDuration(tcxDuration);

    expect(result).toBeNull();
  });

  it("should return null for missing duration type", () => {
    const tcxDuration = { Seconds: 300 };

    const result = convertStandardTcxDuration(tcxDuration);

    expect(result).toBeNull();
  });

  it("should return null for Time_t with non-number Seconds", () => {
    const tcxDuration = { "@_xsi:type": "Time_t", Seconds: "300" };

    const result = convertStandardTcxDuration(tcxDuration);

    expect(result).toBeNull();
  });

  it("should return null for Time_t with zero seconds", () => {
    const tcxDuration = { "@_xsi:type": "Time_t", Seconds: 0 };

    const result = convertStandardTcxDuration(tcxDuration);

    expect(result).toBeNull();
  });

  it("should return null for Distance_t with non-number Meters", () => {
    const tcxDuration = { "@_xsi:type": "Distance_t", Meters: "1000" };

    const result = convertStandardTcxDuration(tcxDuration);

    expect(result).toBeNull();
  });

  it("should return null for Distance_t with zero meters", () => {
    const tcxDuration = { "@_xsi:type": "Distance_t", Meters: 0 };

    const result = convertStandardTcxDuration(tcxDuration);

    expect(result).toBeNull();
  });

  it("should handle large time values", () => {
    const tcxDuration = { "@_xsi:type": "Time_t", Seconds: 7200 };

    const result = convertStandardTcxDuration(tcxDuration);

    expect(result).toStrictEqual({ type: "time", seconds: 7200 });
  });

  it("should handle fractional meters", () => {
    const tcxDuration = { "@_xsi:type": "Distance_t", Meters: 1609.34 };

    const result = convertStandardTcxDuration(tcxDuration);

    expect(result).toStrictEqual({ type: "distance", meters: 1609.34 });
  });

  it("should return null for Time_t without Seconds property", () => {
    const tcxDuration = { "@_xsi:type": "Time_t" };

    const result = convertStandardTcxDuration(tcxDuration);

    expect(result).toBeNull();
  });

  it("should return null for Distance_t without Meters property", () => {
    const tcxDuration = { "@_xsi:type": "Distance_t" };

    const result = convertStandardTcxDuration(tcxDuration);

    expect(result).toBeNull();
  });
});
