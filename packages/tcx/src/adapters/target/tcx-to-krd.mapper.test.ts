import { describe, expect, it, vi } from "vitest";
import type { Logger } from "@kaiord/core";
import { mapTargetType, convertTcxTarget } from "./tcx-to-krd.mapper";

const createMockLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe("mapTargetType", () => {
  it("should map HeartRate to heart_rate", () => {
    const result = mapTargetType("HeartRate");

    expect(result).toBe("heart_rate");
  });

  it("should map Speed to pace", () => {
    const result = mapTargetType("Speed");

    expect(result).toBe("pace");
  });

  it("should map Cadence to cadence", () => {
    const result = mapTargetType("Cadence");

    expect(result).toBe("cadence");
  });

  it("should map None to open", () => {
    const result = mapTargetType("None");

    expect(result).toBe("open");
  });

  it("should map undefined to open", () => {
    const result = mapTargetType(undefined);

    expect(result).toBe("open");
  });

  it("should map unknown string to open", () => {
    const result = mapTargetType("Unknown");

    expect(result).toBe("open");
  });
});

describe("convertTcxTarget (mapper)", () => {
  it("should return open target when input is undefined", () => {
    const logger = createMockLogger();

    const result = convertTcxTarget(undefined, logger);

    expect(result).toStrictEqual({ type: "open" });
  });

  it("should return open target for None_t type", () => {
    const logger = createMockLogger();
    const tcxTarget = { "@_xsi:type": "None_t" };

    const result = convertTcxTarget(tcxTarget, logger);

    expect(result).toStrictEqual({ type: "open" });
  });

  describe("HeartRate_t targets", () => {
    it("should convert PredefinedHeartRateZone_t to zone target", () => {
      const logger = createMockLogger();
      const tcxTarget = {
        "@_xsi:type": "HeartRate_t",
        HeartRateZone: {
          "@_xsi:type": "PredefinedHeartRateZone_t",
          Number: 3,
        },
      };

      const result = convertTcxTarget(tcxTarget, logger);

      expect(result).toStrictEqual({
        type: "heart_rate",
        value: { unit: "zone", value: 3 },
      });
    });

    it("should convert CustomHeartRateZone_t to range target", () => {
      const logger = createMockLogger();
      const tcxTarget = {
        "@_xsi:type": "HeartRate_t",
        HeartRateZone: {
          "@_xsi:type": "CustomHeartRateZone_t",
          Low: 120,
          High: 160,
        },
      };

      const result = convertTcxTarget(tcxTarget, logger);

      expect(result).toStrictEqual({
        type: "heart_rate",
        value: { unit: "range", min: 120, max: 160 },
      });
    });

    it("should return null for HeartRate_t without valid zone data", () => {
      const logger = createMockLogger();
      const tcxTarget = {
        "@_xsi:type": "HeartRate_t",
        HeartRateZone: {
          "@_xsi:type": "UnknownZone_t",
        },
      };

      const result = convertTcxTarget(tcxTarget, logger);

      expect(result).toStrictEqual({ type: "open" });
      expect(logger.warn).toHaveBeenCalled();
    });

    it("should return null for HeartRate_t without HeartRateZone", () => {
      const logger = createMockLogger();
      const tcxTarget = {
        "@_xsi:type": "HeartRate_t",
      };

      const result = convertTcxTarget(tcxTarget, logger);

      expect(result).toStrictEqual({ type: "open" });
      expect(logger.warn).toHaveBeenCalled();
    });

    it("should return null for PredefinedHeartRateZone_t with non-number value", () => {
      const logger = createMockLogger();
      const tcxTarget = {
        "@_xsi:type": "HeartRate_t",
        HeartRateZone: {
          "@_xsi:type": "PredefinedHeartRateZone_t",
          Number: "three",
        },
      };

      const result = convertTcxTarget(tcxTarget, logger);

      expect(result).toStrictEqual({ type: "open" });
    });
  });

  it("should log warning for unsupported target type", () => {
    const logger = createMockLogger();
    const tcxTarget = { "@_xsi:type": "Speed_t" };

    convertTcxTarget(tcxTarget, logger);

    expect(logger.warn).toHaveBeenCalledWith("Unsupported target type", {
      targetType: "Speed_t",
    });
  });

  it("should return open for unsupported target type", () => {
    const logger = createMockLogger();
    const tcxTarget = { "@_xsi:type": "UnknownType_t" };

    const result = convertTcxTarget(tcxTarget, logger);

    expect(result).toStrictEqual({ type: "open" });
  });
});
