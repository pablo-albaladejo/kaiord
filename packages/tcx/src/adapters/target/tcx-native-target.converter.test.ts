import { describe, expect, it } from "vitest";

import {
  convertCadenceTarget,
  convertSpeedTarget,
} from "./tcx-native-target.converter";

describe("convertSpeedTarget", () => {
  it("should convert custom speed bounds to a pace range target", () => {
    // Arrange
    const tcxTarget = {
      "@_xsi:type": "Speed_t",
      SpeedZone: {
        "@_xsi:type": "CustomSpeedZone_t",
        LowInMetersPerSecond: 3.0,
        HighInMetersPerSecond: 4.0,
      },
    };

    // Act
    const result = convertSpeedTarget(tcxTarget);

    // Assert
    expect(result).toStrictEqual({
      type: "pace",
      value: { unit: "range", min: 3.0, max: 4.0 },
    });
  });

  it("should convert equal speed bounds to a single pace target", () => {
    // Arrange
    const tcxTarget = {
      "@_xsi:type": "Speed_t",
      SpeedZone: {
        "@_xsi:type": "CustomSpeedZone_t",
        LowInMetersPerSecond: 3.5,
        HighInMetersPerSecond: 3.5,
      },
    };

    // Act
    const result = convertSpeedTarget(tcxTarget);

    // Assert
    expect(result).toStrictEqual({
      type: "pace",
      value: { unit: "mps", value: 3.5 },
    });
  });

  it("should return null when the speed zone has no numeric bounds", () => {
    // Arrange
    const tcxTarget = { "@_xsi:type": "Speed_t" };

    // Act
    const result = convertSpeedTarget(tcxTarget);

    // Assert
    expect(result).toBeNull();
  });
});

describe("convertCadenceTarget", () => {
  it("should halve running cadence from steps to revolutions per minute", () => {
    // Arrange
    const tcxTarget = {
      "@_xsi:type": "Cadence_t",
      CadenceZone: {
        "@_xsi:type": "CustomCadenceZone_t",
        Low: 170,
        High: 190,
      },
    };

    // Act
    const result = convertCadenceTarget(tcxTarget, "running");

    // Assert
    expect(result).toStrictEqual({
      type: "cadence",
      value: { unit: "range", min: 85, max: 95 },
    });
  });

  it("should keep cycling cadence unchanged", () => {
    // Arrange
    const tcxTarget = {
      "@_xsi:type": "Cadence_t",
      CadenceZone: {
        "@_xsi:type": "CustomCadenceZone_t",
        Low: 85,
        High: 95,
      },
    };

    // Act
    const result = convertCadenceTarget(tcxTarget, "cycling");

    // Assert
    expect(result).toStrictEqual({
      type: "cadence",
      value: { unit: "range", min: 85, max: 95 },
    });
  });

  it("should convert equal cadence bounds to a single rpm target", () => {
    // Arrange
    const tcxTarget = {
      "@_xsi:type": "Cadence_t",
      CadenceZone: {
        "@_xsi:type": "CustomCadenceZone_t",
        Low: 90,
        High: 90,
      },
    };

    // Act
    const result = convertCadenceTarget(tcxTarget, "cycling");

    // Assert
    expect(result).toStrictEqual({
      type: "cadence",
      value: { unit: "rpm", value: 90 },
    });
  });

  it("should return null when the cadence zone has no numeric bounds", () => {
    // Arrange
    const tcxTarget = { "@_xsi:type": "Cadence_t" };

    // Act
    const result = convertCadenceTarget(tcxTarget, "cycling");

    // Assert
    expect(result).toBeNull();
  });
});
