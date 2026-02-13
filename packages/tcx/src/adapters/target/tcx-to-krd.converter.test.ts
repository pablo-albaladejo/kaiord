import { describe, expect, it } from "vitest";
import { convertTcxTarget, type TcxTargetData } from "./tcx-to-krd.converter";

describe("convertTcxTarget (tcx-to-krd)", () => {
  describe("heart rate targets", () => {
    it("should convert heart rate zone target", () => {
      const data: TcxTargetData = {
        targetType: "HeartRate",
        heartRateZone: 3,
      };

      const result = convertTcxTarget(data);

      expect(result).toStrictEqual({
        type: "heart_rate",
        value: { unit: "zone", value: 3 },
      });
    });

    it("should convert heart rate range target", () => {
      const data: TcxTargetData = {
        targetType: "HeartRate",
        heartRateLow: 120,
        heartRateHigh: 160,
      };

      const result = convertTcxTarget(data);

      expect(result).toStrictEqual({
        type: "heart_rate",
        value: { unit: "range", min: 120, max: 160 },
      });
    });

    it("should return open when heart rate has no zone or range", () => {
      const data: TcxTargetData = { targetType: "HeartRate" };

      const result = convertTcxTarget(data);

      expect(result).toStrictEqual({ type: "open" });
    });
  });

  describe("speed targets", () => {
    it("should convert speed zone target to pace zone", () => {
      const data: TcxTargetData = {
        targetType: "Speed",
        speedZone: 3,
      };

      const result = convertTcxTarget(data);

      expect(result).toStrictEqual({
        type: "pace",
        value: { unit: "zone", value: 3 },
      });
    });

    it("should convert speed range target to pace range", () => {
      const data: TcxTargetData = {
        targetType: "Speed",
        speedLow: 3.0,
        speedHigh: 4.5,
      };

      const result = convertTcxTarget(data);

      expect(result).toStrictEqual({
        type: "pace",
        value: { unit: "range", min: 3.0, max: 4.5 },
      });
    });

    it("should return open when speed has no zone or range", () => {
      const data: TcxTargetData = { targetType: "Speed" };

      const result = convertTcxTarget(data);

      expect(result).toStrictEqual({ type: "open" });
    });
  });

  describe("cadence targets", () => {
    it("should convert cadence range for cycling without conversion", () => {
      const data: TcxTargetData = {
        targetType: "Cadence",
        cadenceLow: 80,
        cadenceHigh: 100,
        sport: "cycling",
      };

      const result = convertTcxTarget(data);

      expect(result).toStrictEqual({
        type: "cadence",
        value: { unit: "range", min: 80, max: 100 },
      });
    });

    it("should convert cadence range for running with SPM to RPM halving", () => {
      const data: TcxTargetData = {
        targetType: "Cadence",
        cadenceLow: 160,
        cadenceHigh: 180,
        sport: "running",
      };

      const result = convertTcxTarget(data);

      expect(result).toStrictEqual({
        type: "cadence",
        value: { unit: "range", min: 80, max: 90 },
      });
    });

    it("should convert cadence range for Running with capital R", () => {
      const data: TcxTargetData = {
        targetType: "Cadence",
        cadenceLow: 170,
        cadenceHigh: 190,
        sport: "Running",
      };

      const result = convertTcxTarget(data);

      expect(result).toStrictEqual({
        type: "cadence",
        value: { unit: "range", min: 85, max: 95 },
      });
    });

    it("should return open when cadence has no range", () => {
      const data: TcxTargetData = { targetType: "Cadence" };

      const result = convertTcxTarget(data);

      expect(result).toStrictEqual({ type: "open" });
    });

    it("should not halve cadence when sport is undefined", () => {
      const data: TcxTargetData = {
        targetType: "Cadence",
        cadenceLow: 80,
        cadenceHigh: 100,
      };

      const result = convertTcxTarget(data);

      expect(result).toStrictEqual({
        type: "cadence",
        value: { unit: "range", min: 80, max: 100 },
      });
    });
  });

  describe("open and unknown targets", () => {
    it("should return open for undefined target type", () => {
      const data: TcxTargetData = {};

      const result = convertTcxTarget(data);

      expect(result).toStrictEqual({ type: "open" });
    });

    it("should return open for unknown target type", () => {
      const data: TcxTargetData = { targetType: "Unknown" };

      const result = convertTcxTarget(data);

      expect(result).toStrictEqual({ type: "open" });
    });
  });
});
