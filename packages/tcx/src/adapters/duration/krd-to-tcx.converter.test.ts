import { describe, expect, it } from "vitest";
import { convertKrdDurationToTcx } from "./krd-to-tcx.converter";

describe("convertKrdDurationToTcx", () => {
  describe("standard durations", () => {
    it("should convert time duration to Time_t", () => {
      const duration = { type: "time" as const, seconds: 300 };

      const result = convertKrdDurationToTcx(duration);

      expect(result).toStrictEqual({
        tcxDuration: { "@_xsi:type": "Time_t", Seconds: 300 },
        wasRestored: false,
      });
    });

    it("should convert distance duration to Distance_t", () => {
      const duration = { type: "distance" as const, meters: 1000 };

      const result = convertKrdDurationToTcx(duration);

      expect(result).toStrictEqual({
        tcxDuration: { "@_xsi:type": "Distance_t", Meters: 1000 },
        wasRestored: false,
      });
    });

    it("should convert open duration to LapButton_t", () => {
      const duration = { type: "open" as const };

      const result = convertKrdDurationToTcx(duration);

      expect(result).toStrictEqual({
        tcxDuration: { "@_xsi:type": "LapButton_t" },
        wasRestored: false,
      });
    });
  });

  describe("extension restoration", () => {
    it("should restore heartRateAbove from extensions", () => {
      const duration = { type: "open" as const };
      const extensions = { heartRateAbove: 160 };

      const result = convertKrdDurationToTcx(duration, extensions);

      expect(result).toStrictEqual({
        tcxDuration: {
          "@_xsi:type": "HeartRateAbove_t",
          HeartRate: { Value: 160 },
        },
        wasRestored: true,
      });
    });

    it("should restore heartRateBelow from extensions", () => {
      const duration = { type: "open" as const };
      const extensions = { heartRateBelow: 120 };

      const result = convertKrdDurationToTcx(duration, extensions);

      expect(result).toStrictEqual({
        tcxDuration: {
          "@_xsi:type": "HeartRateBelow_t",
          HeartRate: { Value: 120 },
        },
        wasRestored: true,
      });
    });

    it("should restore caloriesBurned from extensions", () => {
      const duration = { type: "open" as const };
      const extensions = { caloriesBurned: 500 };

      const result = convertKrdDurationToTcx(duration, extensions);

      expect(result).toStrictEqual({
        tcxDuration: {
          "@_xsi:type": "CaloriesBurned_t",
          Calories: 500,
        },
        wasRestored: true,
      });
    });

    it("should fall back to standard conversion with empty extensions", () => {
      const duration = { type: "time" as const, seconds: 300 };
      const extensions = {};

      const result = convertKrdDurationToTcx(duration, extensions);

      expect(result).toStrictEqual({
        tcxDuration: { "@_xsi:type": "Time_t", Seconds: 300 },
        wasRestored: false,
      });
    });

    it("should fall back to standard conversion when extensions undefined", () => {
      const duration = { type: "time" as const, seconds: 300 };

      const result = convertKrdDurationToTcx(duration, undefined);

      expect(result).toStrictEqual({
        tcxDuration: { "@_xsi:type": "Time_t", Seconds: 300 },
        wasRestored: false,
      });
    });

    it("should not restore when extension value is not a number", () => {
      const duration = { type: "open" as const };
      const extensions = { heartRateAbove: "160" as unknown as number };

      const result = convertKrdDurationToTcx(duration, extensions);

      expect(result).toStrictEqual({
        tcxDuration: { "@_xsi:type": "LapButton_t" },
        wasRestored: false,
      });
    });
  });

  describe("unsupported duration types fallback", () => {
    it("should convert heart_rate_less_than to LapButton_t", () => {
      const duration = { type: "heart_rate_less_than" as const, bpm: 140 };

      const result = convertKrdDurationToTcx(duration);

      expect(result).toStrictEqual({
        tcxDuration: { "@_xsi:type": "LapButton_t" },
        wasRestored: false,
      });
    });
  });
});
