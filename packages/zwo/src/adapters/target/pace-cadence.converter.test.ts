import { describe, expect, it } from "vitest";

import {
  convertKrdCadenceToZwift,
  convertKrdPaceToZwift,
  convertZwiftCadenceTarget,
  convertZwiftPaceTarget,
} from "./pace-cadence.converter";

describe("convertZwiftPaceTarget", () => {
  it("should convert seconds per km to meters per second", () => {
    // Arrange

    // Act
    const result = convertZwiftPaceTarget(300);

    // Assert
    expect(result).toStrictEqual({
      type: "pace",
      value: { unit: "mps", value: 1000 / 300 },
    });
  });

  it("should handle fast pace (4 min/km)", () => {
    // Arrange

    // Act
    const result = convertZwiftPaceTarget(240);

    // Assert
    expect(result.type).toBe("pace");
    expect(result.value?.value).toBeCloseTo(4.167, 2);
  });

  it("should handle slow pace (6 min/km)", () => {
    // Arrange

    // Act
    const result = convertZwiftPaceTarget(360);

    // Assert
    expect(result.type).toBe("pace");
    expect(result.value?.value).toBeCloseTo(2.778, 2);
  });

  it("should handle very fast pace (3 min/km)", () => {
    // Arrange

    // Act
    const result = convertZwiftPaceTarget(180);

    // Assert
    expect(result.type).toBe("pace");
    expect(result.value?.value).toBeCloseTo(5.556, 2);
  });

  it("should use mps as unit", () => {
    // Arrange

    // Act
    const result = convertZwiftPaceTarget(300);

    // Assert
    expect(result.value?.unit).toBe("mps");
  });
});

describe("convertZwiftCadenceTarget", () => {
  it("should keep cadence as RPM for cycling", () => {
    // Arrange

    // Act
    const result = convertZwiftCadenceTarget(90, false);

    // Assert
    expect(result).toStrictEqual({
      type: "cadence",
      value: { unit: "rpm", value: 90 },
    });
  });

  it("should convert SPM to RPM for running", () => {
    // Arrange

    // Act
    const result = convertZwiftCadenceTarget(180, true);

    // Assert
    expect(result).toStrictEqual({
      type: "cadence",
      value: { unit: "rpm", value: 90 },
    });
  });

  it("should default to cycling (isRunning = false)", () => {
    // Arrange

    // Act
    const result = convertZwiftCadenceTarget(90);

    // Assert
    expect(result).toStrictEqual({
      type: "cadence",
      value: { unit: "rpm", value: 90 },
    });
  });

  it("should handle low cycling cadence", () => {
    // Arrange

    // Act
    const result = convertZwiftCadenceTarget(60);

    // Assert
    expect(result.value?.value).toBe(60);
  });

  it("should handle high cycling cadence", () => {
    // Arrange

    // Act
    const result = convertZwiftCadenceTarget(120);

    // Assert
    expect(result.value?.value).toBe(120);
  });

  it("should handle running cadence of 160 SPM", () => {
    // Arrange

    // Act
    const result = convertZwiftCadenceTarget(160, true);

    // Assert
    expect(result.value?.value).toBe(80);
  });

  it("should handle running cadence of 200 SPM", () => {
    // Arrange

    // Act
    const result = convertZwiftCadenceTarget(200, true);

    // Assert
    expect(result.value?.value).toBe(100);
  });
});

describe("convertKrdPaceToZwift", () => {
  it("should convert m/s to seconds per km", () => {
    // Arrange

    // Act
    const result = convertKrdPaceToZwift(1000 / 300);

    // Assert
    expect(result).toBeCloseTo(300, 1);
  });

  it("should handle fast running pace", () => {
    // Arrange

    // Act
    const result = convertKrdPaceToZwift(1000 / 240);

    // Assert
    expect(result).toBeCloseTo(240, 1);
  });

  it("should handle slow walking pace", () => {
    // Arrange

    // Act
    const result = convertKrdPaceToZwift(1000 / 600);

    // Assert
    expect(result).toBeCloseTo(600, 1);
  });
});

describe("convertKrdCadenceToZwift", () => {
  it("should keep RPM as-is for cycling", () => {
    // Arrange

    // Act
    const result = convertKrdCadenceToZwift(90, false);

    // Assert
    expect(result).toBe(90);
  });

  it("should convert RPM to SPM for running", () => {
    // Arrange

    // Act
    const result = convertKrdCadenceToZwift(90, true);

    // Assert
    expect(result).toBe(180);
  });

  it("should default to cycling (isRunning = false)", () => {
    // Arrange

    // Act
    const result = convertKrdCadenceToZwift(90);

    // Assert
    expect(result).toBe(90);
  });

  it("should handle low RPM for running", () => {
    // Arrange

    // Act
    const result = convertKrdCadenceToZwift(80, true);

    // Assert
    expect(result).toBe(160);
  });

  it("should handle high RPM for running", () => {
    // Arrange

    // Act
    const result = convertKrdCadenceToZwift(100, true);

    // Assert
    expect(result).toBe(200);
  });
});
