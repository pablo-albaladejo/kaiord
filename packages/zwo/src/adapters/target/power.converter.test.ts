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
  it.each([
    { ftp: 0.85, pct: 85 },
    { ftp: 0.5, pct: 50 },
    { ftp: 1.5, pct: 150 },
    { ftp: 3.0, pct: 300 },
    { ftp: 0, pct: 0 },
  ])("should convert $ftp FTP to $pct percent_ftp", ({ ftp, pct }) => {
    // Arrange

    // Act
    const result = convertZwiftPowerTarget(ftp);

    // Assert
    expect(result).toStrictEqual({
      type: "power",
      value: { unit: "percent_ftp", value: pct },
    });
  });
});

describe("convertZwiftPowerRange", () => {
  it.each([
    { low: 0.6, high: 0.8, min: 60, max: 80 },
    { low: 0.25, high: 0.75, min: 25, max: 75 },
    { low: 0.75, high: 0.5, min: 75, max: 50 },
    { low: 1.0, high: 1.2, min: 100, max: 120 },
  ])(
    "should convert FTP range $low/$high to percent range $min/$max",
    ({ low, high, min, max }) => {
      // Arrange

      // Act
      const result = convertZwiftPowerRange(low, high);

      // Assert
      expect(result).toStrictEqual({
        type: "power",
        value: { unit: "range", min, max },
      });
    }
  );
});

describe("convertKrdPowerToZwift", () => {
  it.each([
    { pct: 85, ftp: 0.85 },
    { pct: 100, ftp: 1.0 },
    { pct: 150, ftp: 1.5 },
    { pct: 50, ftp: 0.5 },
  ])("should convert $pct percent_ftp to $ftp FTP", ({ pct, ftp }) => {
    // Arrange

    // Act
    const result = convertKrdPowerToZwift(pct);

    // Assert
    expect(result).toBe(ftp);
  });
});

describe("convertKrdPowerRangeToZwift", () => {
  it.each([
    { min: 60, max: 80, out: [0.6, 0.8] },
    { min: 25, max: 75, out: [0.25, 0.75] },
    { min: 75, max: 50, out: [0.75, 0.5] },
  ])(
    "should convert percent range $min/$max to Zwift FTP range",
    ({ min, max, out }) => {
      // Arrange

      // Act
      const result = convertKrdPowerRangeToZwift(min, max);

      // Assert
      expect(result).toStrictEqual(out);
    }
  );
});

describe("convertPowerZoneToPercentFtp", () => {
  it.each([
    { zone: 1, pct: 55 },
    { zone: 2, pct: 75 },
    { zone: 3, pct: 90 },
    { zone: 4, pct: 105 },
    { zone: 5, pct: 120 },
    { zone: 6, pct: 150 },
    { zone: 7, pct: 200 },
  ])("should convert zone $zone to $pct percent", ({ zone, pct }) => {
    // Arrange

    // Act
    const result = convertPowerZoneToPercentFtp(zone);

    // Assert
    expect(result).toBe(pct);
  });

  it.each([0, 8, -1])(
    "should throw RangeError for out-of-range zone %i",
    (invalidZone) => {
      // Arrange

      // Act
      const act = () => convertPowerZoneToPercentFtp(invalidZone);

      // Assert
      expect(act).toThrow(RangeError);
    }
  );
});
