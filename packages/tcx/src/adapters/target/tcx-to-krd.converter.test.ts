import { describe, expect, it } from "vitest";

import { convertTcxTarget, type TcxTargetData } from "./tcx-to-krd.converter";

describe("convertTcxTarget (tcx-to-krd)", () => {
  describe("heart rate targets", () => {
    it("should convert heart rate zone target", () => {
      // Arrange
      const data: TcxTargetData = {
        targetType: "HeartRate",
        heartRateZone: 3,
      };

      // Act
      const result = convertTcxTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "heart_rate",
        value: { unit: "zone", value: 3 },
      });
    });

    it("should convert heart rate range target", () => {
      // Arrange
      const data: TcxTargetData = {
        targetType: "HeartRate",
        heartRateLow: 120,
        heartRateHigh: 160,
      };

      // Act
      const result = convertTcxTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "heart_rate",
        value: { unit: "range", min: 120, max: 160 },
      });
    });

    it("should return open when heart rate has no zone or range", () => {
      // Arrange
      const data: TcxTargetData = { targetType: "HeartRate" };

      // Act
      const result = convertTcxTarget(data);

      // Assert
      expect(result).toStrictEqual({ type: "open" });
    });
  });

  describe("speed targets", () => {
    it("should convert speed zone target to pace zone", () => {
      // Arrange
      const data: TcxTargetData = {
        targetType: "Speed",
        speedZone: 3,
      };

      // Act
      const result = convertTcxTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "pace",
        value: { unit: "zone", value: 3 },
      });
    });

    it("should convert speed range target to pace range", () => {
      // Arrange
      const data: TcxTargetData = {
        targetType: "Speed",
        speedLow: 3.0,
        speedHigh: 4.5,
      };

      // Act
      const result = convertTcxTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "pace",
        value: { unit: "range", min: 3.0, max: 4.5 },
      });
    });

    it("should return open when speed has no zone or range", () => {
      // Arrange
      const data: TcxTargetData = { targetType: "Speed" };

      // Act
      const result = convertTcxTarget(data);

      // Assert
      expect(result).toStrictEqual({ type: "open" });
    });
  });

  describe("cadence targets", () => {
    it("should convert cadence range for cycling without conversion", () => {
      // Arrange
      const data: TcxTargetData = {
        targetType: "Cadence",
        cadenceLow: 80,
        cadenceHigh: 100,
        sport: "cycling",
      };

      // Act
      const result = convertTcxTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "cadence",
        value: { unit: "range", min: 80, max: 100 },
      });
    });

    it("should convert cadence range for running with SPM to RPM halving", () => {
      // Arrange
      const data: TcxTargetData = {
        targetType: "Cadence",
        cadenceLow: 160,
        cadenceHigh: 180,
        sport: "running",
      };

      // Act
      const result = convertTcxTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "cadence",
        value: { unit: "range", min: 80, max: 90 },
      });
    });

    it("should convert cadence range for Running with capital R", () => {
      // Arrange
      const data: TcxTargetData = {
        targetType: "Cadence",
        cadenceLow: 170,
        cadenceHigh: 190,
        sport: "Running",
      };

      // Act
      const result = convertTcxTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "cadence",
        value: { unit: "range", min: 85, max: 95 },
      });
    });

    it("should return open when cadence has no range", () => {
      // Arrange
      const data: TcxTargetData = { targetType: "Cadence" };

      // Act
      const result = convertTcxTarget(data);

      // Assert
      expect(result).toStrictEqual({ type: "open" });
    });

    it("should not halve cadence when sport is undefined", () => {
      // Arrange
      const data: TcxTargetData = {
        targetType: "Cadence",
        cadenceLow: 80,
        cadenceHigh: 100,
      };

      // Act
      const result = convertTcxTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "cadence",
        value: { unit: "range", min: 80, max: 100 },
      });
    });
  });

  describe("open and unknown targets", () => {
    it("should return open for undefined target type", () => {
      // Arrange
      const data: TcxTargetData = {};

      // Act
      const result = convertTcxTarget(data);

      // Assert
      expect(result).toStrictEqual({ type: "open" });
    });

    it("should return open for unknown target type", () => {
      // Arrange
      const data: TcxTargetData = { targetType: "Unknown" };

      // Act
      const result = convertTcxTarget(data);

      // Assert
      expect(result).toStrictEqual({ type: "open" });
    });
  });
});
