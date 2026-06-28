import type { Logger } from "@kaiord/core";
import { describe, expect, it, vi } from "vitest";

import {
  convertTcxTarget,
  mapTargetType,
} from "./tcx-target-decoder.converter";

const createMockLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe("mapTargetType", () => {
  it.each([
    ["HeartRate", "heart_rate"],
    ["Speed", "pace"],
    ["Cadence", "cadence"],
    ["None", "open"],
    [undefined, "open"],
    ["Unknown", "open"],
  ])("should map %s to %s", (input, expected) => {
    // Arrange

    // Act
    const result = mapTargetType(input);

    // Assert
    expect(result).toBe(expected);
  });
});

describe("convertTcxTarget (mapper)", () => {
  it("should return open target when input is undefined", () => {
    // Arrange
    const logger = createMockLogger();

    // Act
    const result = convertTcxTarget(undefined, "generic", logger);

    // Assert
    expect(result).toStrictEqual({ type: "open" });
  });

  it("should return open target for None_t type", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxTarget = { "@_xsi:type": "None_t" };

    // Act
    const result = convertTcxTarget(tcxTarget, "generic", logger);

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
      const result = convertTcxTarget(tcxTarget, "generic", logger);

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
      const result = convertTcxTarget(tcxTarget, "generic", logger);

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
      const result = convertTcxTarget(tcxTarget, "generic", logger);

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
      const result = convertTcxTarget(tcxTarget, "generic", logger);

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
      const result = convertTcxTarget(tcxTarget, "generic", logger);

      // Assert
      expect(result).toStrictEqual({ type: "open" });
    });
  });

  it("should route Speed_t targets to the native speed decoder", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxTarget = {
      "@_xsi:type": "Speed_t",
      SpeedZone: {
        "@_xsi:type": "CustomSpeedZone_t",
        LowInMetersPerSecond: 3.0,
        HighInMetersPerSecond: 4.0,
      },
    };

    // Act
    const result = convertTcxTarget(tcxTarget, "running", logger);

    // Assert
    expect(result?.type).toBe("pace");
  });

  it("should route Cadence_t targets to the sport-aware cadence decoder", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxTarget = {
      "@_xsi:type": "Cadence_t",
      CadenceZone: {
        "@_xsi:type": "CustomCadenceZone_t",
        Low: 170,
        High: 190,
      },
    };

    // Act
    const result = convertTcxTarget(tcxTarget, "running", logger);

    // Assert
    expect(result).toStrictEqual({
      type: "cadence",
      value: { unit: "range", min: 85, max: 95 },
    });
  });

  it("should warn and return open for unsupported target type", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxTarget = { "@_xsi:type": "UnknownType_t" };

    // Act
    const result = convertTcxTarget(tcxTarget, "generic", logger);

    // Assert
    expect(logger.warn).toHaveBeenCalledWith("Unsupported target type", {
      targetType: "UnknownType_t",
    });
    expect(result).toStrictEqual({ type: "open" });
  });
});
