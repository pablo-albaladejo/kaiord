import { describe, expect, it } from "vitest";

import {
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
    { ftp: 0.57, pct: 57 },
    { ftp: 0.8766, pct: 87.7 },
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
    { low: 0.75, high: 0.5, min: 50, max: 75 },
    { low: 0.57, high: 0.8, min: 57, max: 80 },
    { low: 1.0, high: 1.2, min: 100, max: 120 },
  ])(
    "should convert FTP range $low/$high to a percent_ftp range $min/$max",
    ({ low, high, min, max }) => {
      // Arrange

      // Act
      const result = convertZwiftPowerRange(low, high);

      // Assert
      expect(result).toStrictEqual({
        type: "power",
        value: { unit: "range", min, max, basis: "percent_ftp" },
      });
    }
  );
});
