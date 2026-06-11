import { describe, expect, it } from "vitest";

import { buildFitTargetData } from "../../tests/fixtures/fit-target.fixtures";
import { convertFitTarget } from "./target.converter";

// Dispatcher-only suite. convertFitTarget branches on `data.targetType` and
// delegates to the per-type leaf converter. These tests pin the dispatch table
// (one routing assertion per branch). Value-level correctness for each target
// type lives in the leaf suites: target-power / target-heart-rate /
// target-cadence / target-pace / target-stroke .converter.test.ts.

describe("convertFitTarget (dispatcher)", () => {
  it("should route power to the power converter", () => {
    // Arrange
    const data = buildFitTargetData.build({
      targetType: "power",
      targetPowerZone: 3,
    });

    // Act
    const result = convertFitTarget(data);

    // Assert
    expect(result.type).toBe("power");
  });

  it("should route heartRate to the heart-rate converter", () => {
    // Arrange
    const data = buildFitTargetData.build({
      targetType: "heartRate",
      targetHrZone: 3,
    });

    // Act
    const result = convertFitTarget(data);

    // Assert
    expect(result.type).toBe("heart_rate");
  });

  it("should route cadence to the cadence converter", () => {
    // Arrange
    const data = buildFitTargetData.build({
      targetType: "cadence",
      targetValue: 90,
    });

    // Act
    const result = convertFitTarget(data);

    // Assert
    expect(result.type).toBe("cadence");
  });

  it("should route speed to the pace converter", () => {
    // Arrange
    const data = buildFitTargetData.build({
      targetType: "speed",
      targetSpeedZone: 3,
    });

    // Act
    const result = convertFitTarget(data);

    // Assert
    expect(result.type).toBe("pace");
  });

  it("should route swimStroke to the stroke-type converter", () => {
    // Arrange
    const data = buildFitTargetData.build({
      targetType: "swimStroke",
      targetSwimStroke: 0,
    });

    // Act
    const result = convertFitTarget(data);

    // Assert
    expect(result.type).toBe("stroke_type");
  });

  it("should fall back to open for an unhandled target type", () => {
    // Arrange
    const data = buildFitTargetData.build({
      targetType: "unknown",
    });

    // Act
    const result = convertFitTarget(data);

    // Assert
    expect(result).toStrictEqual({ type: "open" });
  });
});
