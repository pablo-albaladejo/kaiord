import { describe, expect, it } from "vitest";
import { convertPaceTargetToTcx } from "./pace.converter";

describe("convertPaceTargetToTcx", () => {
  it("should convert zone unit to Speed_t with same low and high", () => {
    const value = { unit: "zone", value: 3.5 };

    const result = convertPaceTargetToTcx(value);

    expect(result).toStrictEqual({
      "@_xsi:type": "Speed_t",
      SpeedZone: {
        "@_xsi:type": "CustomSpeedZone_t",
        LowInMetersPerSecond: 3.5,
        HighInMetersPerSecond: 3.5,
      },
    });
  });

  it("should convert range unit to Speed_t with min and max", () => {
    const value = { unit: "range", min: 3.0, max: 4.5 };

    const result = convertPaceTargetToTcx(value);

    expect(result).toStrictEqual({
      "@_xsi:type": "Speed_t",
      SpeedZone: {
        "@_xsi:type": "CustomSpeedZone_t",
        LowInMetersPerSecond: 3.0,
        HighInMetersPerSecond: 4.5,
      },
    });
  });

  it("should convert mps unit to Speed_t with same low and high", () => {
    const value = { unit: "mps", value: 4.2 };

    const result = convertPaceTargetToTcx(value);

    expect(result).toStrictEqual({
      "@_xsi:type": "Speed_t",
      SpeedZone: {
        "@_xsi:type": "CustomSpeedZone_t",
        LowInMetersPerSecond: 4.2,
        HighInMetersPerSecond: 4.2,
      },
    });
  });

  it("should return None_t for unsupported unit", () => {
    const value = { unit: "unknown", value: 5 };

    const result = convertPaceTargetToTcx(value);

    expect(result).toStrictEqual({ "@_xsi:type": "None_t" });
  });

  it("should handle zone unit with undefined value", () => {
    const value = { unit: "zone" };

    const result = convertPaceTargetToTcx(value);

    expect(result).toStrictEqual({
      "@_xsi:type": "Speed_t",
      SpeedZone: {
        "@_xsi:type": "CustomSpeedZone_t",
        LowInMetersPerSecond: undefined,
        HighInMetersPerSecond: undefined,
      },
    });
  });

  it("should handle range unit with undefined min and max", () => {
    const value = { unit: "range" };

    const result = convertPaceTargetToTcx(value);

    expect(result).toStrictEqual({
      "@_xsi:type": "Speed_t",
      SpeedZone: {
        "@_xsi:type": "CustomSpeedZone_t",
        LowInMetersPerSecond: undefined,
        HighInMetersPerSecond: undefined,
      },
    });
  });

  it("should handle fast running pace", () => {
    const value = { unit: "mps", value: 5.56 };

    const result = convertPaceTargetToTcx(value);

    expect(result).toStrictEqual({
      "@_xsi:type": "Speed_t",
      SpeedZone: {
        "@_xsi:type": "CustomSpeedZone_t",
        LowInMetersPerSecond: 5.56,
        HighInMetersPerSecond: 5.56,
      },
    });
  });

  it("should handle slow walking pace", () => {
    const value = { unit: "mps", value: 1.2 };

    const result = convertPaceTargetToTcx(value);

    expect(result).toStrictEqual({
      "@_xsi:type": "Speed_t",
      SpeedZone: {
        "@_xsi:type": "CustomSpeedZone_t",
        LowInMetersPerSecond: 1.2,
        HighInMetersPerSecond: 1.2,
      },
    });
  });
});
