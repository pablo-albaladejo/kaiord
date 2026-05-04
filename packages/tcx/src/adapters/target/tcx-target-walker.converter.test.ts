import type { Logger } from "@kaiord/core";
import { describe, expect, it, vi } from "vitest";

import { convertTcxTarget, mapTargetType } from "./tcx-target-walker.converter";

const createMockLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe("mapTargetType", () => {
  it("should map HeartRate to heart_rate", () => {
    // Arrange

    // Act
    const result = mapTargetType("HeartRate");

    // Assert
    expect(result).toBe("heart_rate");
  });

  it("should map Speed to pace", () => {
    // Arrange

    // Act
    const result = mapTargetType("Speed");

    // Assert
    expect(result).toBe("pace");
  });

  it("should map Cadence to cadence", () => {
    // Arrange

    // Act
    const result = mapTargetType("Cadence");

    // Assert
    expect(result).toBe("cadence");
  });

  it("should map None to open", () => {
    // Arrange

    // Act
    const result = mapTargetType("None");

    // Assert
    expect(result).toBe("open");
  });

  it("should map undefined to open", () => {
    // Arrange

    // Act
    const result = mapTargetType(undefined);

    // Assert
    expect(result).toBe("open");
  });

  it("should map unknown string to open", () => {
    // Arrange

    // Act
    const result = mapTargetType("Unknown");

    // Assert
    expect(result).toBe("open");
  });
});

describe("convertTcxTarget (mapper)", () => {
  it("should return open target when input is undefined", () => {
    // Arrange
    const logger = createMockLogger();

    // Act
    const result = convertTcxTarget(undefined, logger);

    // Assert
    expect(result).toStrictEqual({ type: "open" });
  });

  it("should return open target for None_t type", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxTarget = { "@_xsi:type": "None_t" };

    // Act
    const result = convertTcxTarget(tcxTarget, logger);

    // Assert
    expect(result).toStrictEqual({ type: "open" });
  });

  describe("HeartRate_t targets", () => {
    it("should convert PredefinedHeartRateZone_t to zone target", () => {
      // Arrange
      const logger = createMockLogger();
      const tcxTarget = {
        "@_xsi:type": "HeartRate_t",
        HeartRateZone: {
          "@_xsi:type": "PredefinedHeartRateZone_t",
          Number: 3,
        },
      };

      // Act
      const result = convertTcxTarget(tcxTarget, logger);

      // Assert
      expect(result).toStrictEqual({
        type: "heart_rate",
        value: { unit: "zone", value: 3 },
      });
    });

    it("should convert CustomHeartRateZone_t to range target", () => {
      // Arrange
      const logger = createMockLogger();
      const tcxTarget = {
        "@_xsi:type": "HeartRate_t",
        HeartRateZone: {
          "@_xsi:type": "CustomHeartRateZone_t",
          Low: 120,
          High: 160,
        },
      };

      // Act
      const result = convertTcxTarget(tcxTarget, logger);

      // Assert
      expect(result).toStrictEqual({
        type: "heart_rate",
        value: { unit: "range", min: 120, max: 160 },
      });
    });

    it("should return open for HeartRate_t without valid zone data", () => {
      // Arrange
      const logger = createMockLogger();
      const tcxTarget = {
        "@_xsi:type": "HeartRate_t",
        HeartRateZone: {
          "@_xsi:type": "UnknownZone_t",
        },
      };

      // Act
      const result = convertTcxTarget(tcxTarget, logger);

      // Assert
      expect(result).toStrictEqual({ type: "open" });
      expect(logger.warn).toHaveBeenCalled();
    });

    it("should return open for HeartRate_t without HeartRateZone", () => {
      // Arrange
      const logger = createMockLogger();
      const tcxTarget = {
        "@_xsi:type": "HeartRate_t",
      };

      // Act
      const result = convertTcxTarget(tcxTarget, logger);

      // Assert
      expect(result).toStrictEqual({ type: "open" });
      expect(logger.warn).toHaveBeenCalled();
    });

    it("should return open for PredefinedHeartRateZone_t with non-number value", () => {
      // Arrange
      const logger = createMockLogger();
      const tcxTarget = {
        "@_xsi:type": "HeartRate_t",
        HeartRateZone: {
          "@_xsi:type": "PredefinedHeartRateZone_t",
          Number: "three",
        },
      };

      // Act
      const result = convertTcxTarget(tcxTarget, logger);

      // Assert
      expect(result).toStrictEqual({ type: "open" });
    });
  });

  it("should log warning for unsupported target type", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxTarget = { "@_xsi:type": "Speed_t" };

    // Act
    convertTcxTarget(tcxTarget, logger);

    // Assert
    expect(logger.warn).toHaveBeenCalledWith("Unsupported target type", {
      targetType: "Speed_t",
    });
  });

  it("should return open for unsupported target type", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxTarget = { "@_xsi:type": "UnknownType_t" };

    // Act
    const result = convertTcxTarget(tcxTarget, logger);

    // Assert
    expect(result).toStrictEqual({ type: "open" });
  });
});
