/* eslint-disable no-magic-numbers -- test fixtures use literal FTP/percent/zone values for clarity */
import { describe, expect, it } from "vitest";

import {
  convertKrdPowerRangeToZwift,
  convertKrdPowerToZwift,
  convertPowerZoneToPercentFtp,
  convertZwiftPowerRange,
  convertZwiftPowerTarget,
} from "./power.converter";

describe("convertZwiftPowerTarget", () => {
  it("should convert 0.85 FTP to 85 percent_ftp", () => {
    // Arrange

    // Act
    const result = convertZwiftPowerTarget(0.85);

    // Assert
    expect(result).toStrictEqual({
      type: "power",
      value: { unit: "percent_ftp", value: 85 },
    });
  });

  it("should convert 0.5 FTP to 50 percent_ftp", () => {
    // Arrange

    // Act
    const result = convertZwiftPowerTarget(0.5);

    // Assert
    expect(result).toStrictEqual({
      type: "power",
      value: { unit: "percent_ftp", value: 50 },
    });
  });

  it("should convert 1.5 FTP to 150 percent_ftp", () => {
    // Arrange

    // Act
    const result = convertZwiftPowerTarget(1.5);

    // Assert
    expect(result).toStrictEqual({
      type: "power",
      value: { unit: "percent_ftp", value: 150 },
    });
  });

  it("should convert 3.0 FTP to 300 percent_ftp", () => {
    // Arrange

    // Act
    const result = convertZwiftPowerTarget(3.0);

    // Assert
    expect(result).toStrictEqual({
      type: "power",
      value: { unit: "percent_ftp", value: 300 },
    });
  });

  it("should handle zero FTP percentage", () => {
    // Arrange

    // Act
    const result = convertZwiftPowerTarget(0);

    // Assert
    expect(result).toStrictEqual({
      type: "power",
      value: { unit: "percent_ftp", value: 0 },
    });
  });
});

describe("convertZwiftPowerRange", () => {
  it("should convert low/high FTP range to percent range", () => {
    // Arrange

    // Act
    const result = convertZwiftPowerRange(0.6, 0.8);

    // Assert
    expect(result).toStrictEqual({
      type: "power",
      value: { unit: "range", min: 60, max: 80 },
    });
  });

  it("should handle warmup range", () => {
    // Arrange

    // Act
    const result = convertZwiftPowerRange(0.25, 0.75);

    // Assert
    expect(result).toStrictEqual({
      type: "power",
      value: { unit: "range", min: 25, max: 75 },
    });
  });

  it("should handle cooldown range (high to low)", () => {
    // Arrange

    // Act
    const result = convertZwiftPowerRange(0.75, 0.5);

    // Assert
    expect(result).toStrictEqual({
      type: "power",
      value: { unit: "range", min: 75, max: 50 },
    });
  });

  it("should handle full FTP range", () => {
    // Arrange

    // Act
    const result = convertZwiftPowerRange(1.0, 1.2);

    // Assert
    expect(result).toStrictEqual({
      type: "power",
      value: { unit: "range", min: 100, max: 120 },
    });
  });
});

describe("convertKrdPowerToZwift", () => {
  it("should convert 85 percent_ftp to 0.85", () => {
    // Arrange

    // Act
    const result = convertKrdPowerToZwift(85);

    // Assert
    expect(result).toBe(0.85);
  });

  it("should convert 100 percent_ftp to 1.0", () => {
    // Arrange

    // Act
    const result = convertKrdPowerToZwift(100);

    // Assert
    expect(result).toBe(1.0);
  });

  it("should convert 150 percent_ftp to 1.5", () => {
    // Arrange

    // Act
    const result = convertKrdPowerToZwift(150);

    // Assert
    expect(result).toBe(1.5);
  });

  it("should convert 50 percent_ftp to 0.5", () => {
    // Arrange

    // Act
    const result = convertKrdPowerToZwift(50);

    // Assert
    expect(result).toBe(0.5);
  });
});

describe("convertKrdPowerRangeToZwift", () => {
  it("should convert percent range to Zwift FTP range", () => {
    // Arrange

    // Act
    const result = convertKrdPowerRangeToZwift(60, 80);

    // Assert
    expect(result).toStrictEqual([0.6, 0.8]);
  });

  it("should handle warmup range", () => {
    // Arrange

    // Act
    const result = convertKrdPowerRangeToZwift(25, 75);

    // Assert
    expect(result).toStrictEqual([0.25, 0.75]);
  });

  it("should handle cooldown range", () => {
    // Arrange

    // Act
    const result = convertKrdPowerRangeToZwift(75, 50);

    // Assert
    expect(result).toStrictEqual([0.75, 0.5]);
  });
});

describe("convertPowerZoneToPercentFtp", () => {
  it("should convert zone 1 to 55%", () => {
    // Arrange

    // Act
    const result = convertPowerZoneToPercentFtp(1);

    // Assert
    expect(result).toBe(55);
  });

  it("should convert zone 2 to 75%", () => {
    // Arrange

    // Act
    const result = convertPowerZoneToPercentFtp(2);

    // Assert
    expect(result).toBe(75);
  });

  it("should convert zone 3 to 90%", () => {
    // Arrange

    // Act
    const result = convertPowerZoneToPercentFtp(3);

    // Assert
    expect(result).toBe(90);
  });

  it("should convert zone 4 to 105%", () => {
    // Arrange

    // Act
    const result = convertPowerZoneToPercentFtp(4);

    // Assert
    expect(result).toBe(105);
  });

  it("should convert zone 5 to 120%", () => {
    // Arrange

    // Act
    const result = convertPowerZoneToPercentFtp(5);

    // Assert
    expect(result).toBe(120);
  });

  it("should convert zone 6 to 150%", () => {
    // Arrange

    // Act
    const result = convertPowerZoneToPercentFtp(6);

    // Assert
    expect(result).toBe(150);
  });

  it("should convert zone 7 to 200%", () => {
    // Arrange

    // Act
    const result = convertPowerZoneToPercentFtp(7);

    // Assert
    expect(result).toBe(200);
  });

  it("should throw RangeError for zone 0 (below range)", () => {
    // Arrange
    const invalidZone = 0;

    // Act
    const act = () => convertPowerZoneToPercentFtp(invalidZone);

    // Assert
    expect(act).toThrow(RangeError);
  });

  it("should throw RangeError for zone 8 (above range)", () => {
    // Arrange
    const invalidZone = 8;

    // Act
    const act = () => convertPowerZoneToPercentFtp(invalidZone);

    // Assert
    expect(act).toThrow(RangeError);
  });

  it("should throw RangeError for negative zone", () => {
    // Arrange
    const invalidZone = -1;

    // Act
    const act = () => convertPowerZoneToPercentFtp(invalidZone);

    // Assert
    expect(act).toThrow(RangeError);
  });
});
