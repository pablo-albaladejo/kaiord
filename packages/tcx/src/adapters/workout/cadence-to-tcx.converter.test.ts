import { describe, expect, it } from "vitest";

import { convertCadenceToTcx } from "./cadence-to-tcx.converter";

describe("convertCadenceToTcx", () => {
  it("should convert cycling rpm to CustomCadenceZone_t unchanged", () => {
    // Arrange

    // Act
    const result = convertCadenceToTcx({ unit: "rpm", value: 90 }, "cycling");

    // Assert
    expect(result).toStrictEqual({
      "@_xsi:type": "Cadence_t",
      CadenceZone: {
        "@_xsi:type": "CustomCadenceZone_t",
        Low: 90,
        High: 90,
      },
    });
  });

  it("should convert a cycling cadence range to CustomCadenceZone_t unchanged", () => {
    // Arrange

    // Act
    const result = convertCadenceToTcx(
      { unit: "range", min: 80, max: 100 },
      "cycling"
    );

    // Assert
    expect(result).toStrictEqual({
      "@_xsi:type": "Cadence_t",
      CadenceZone: {
        "@_xsi:type": "CustomCadenceZone_t",
        Low: 80,
        High: 100,
      },
    });
  });

  it("should double running rpm into steps per minute", () => {
    // Arrange

    // Act
    const result = convertCadenceToTcx({ unit: "rpm", value: 90 }, "running");

    // Assert
    expect(result).toStrictEqual({
      "@_xsi:type": "Cadence_t",
      CadenceZone: {
        "@_xsi:type": "CustomCadenceZone_t",
        Low: 180,
        High: 180,
      },
    });
  });

  it("should double a running cadence range into steps per minute", () => {
    // Arrange

    // Act
    const result = convertCadenceToTcx(
      { unit: "range", min: 85, max: 95 },
      "running"
    );

    // Assert
    expect(result).toStrictEqual({
      "@_xsi:type": "Cadence_t",
      CadenceZone: {
        "@_xsi:type": "CustomCadenceZone_t",
        Low: 170,
        High: 190,
      },
    });
  });

  it("should return None_t for unsupported unit", () => {
    // Arrange

    // Act
    const result = convertCadenceToTcx({ unit: "zone", value: 3 }, "cycling");

    // Assert
    expect(result).toStrictEqual({ "@_xsi:type": "None_t" });
  });
});
