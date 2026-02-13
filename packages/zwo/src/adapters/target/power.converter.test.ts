import { describe, expect, it } from "vitest";
import {
  convertZwiftPowerTarget,
  convertZwiftPowerRange,
  convertKrdPowerToZwift,
  convertKrdPowerRangeToZwift,
  convertPowerZoneToPercentFtp,
} from "./power.converter";

describe("convertZwiftPowerTarget", () => {
  it("should convert 0.85 FTP to 85 percent_ftp", () => {
    const result = convertZwiftPowerTarget(0.85);

    expect(result).toStrictEqual({
      type: "power",
      value: { unit: "percent_ftp", value: 85 },
    });
  });

  it("should convert 0.5 FTP to 50 percent_ftp", () => {
    const result = convertZwiftPowerTarget(0.5);

    expect(result).toStrictEqual({
      type: "power",
      value: { unit: "percent_ftp", value: 50 },
    });
  });

  it("should convert 1.5 FTP to 150 percent_ftp", () => {
    const result = convertZwiftPowerTarget(1.5);

    expect(result).toStrictEqual({
      type: "power",
      value: { unit: "percent_ftp", value: 150 },
    });
  });

  it("should convert 3.0 FTP to 300 percent_ftp", () => {
    const result = convertZwiftPowerTarget(3.0);

    expect(result).toStrictEqual({
      type: "power",
      value: { unit: "percent_ftp", value: 300 },
    });
  });

  it("should handle zero FTP percentage", () => {
    const result = convertZwiftPowerTarget(0);

    expect(result).toStrictEqual({
      type: "power",
      value: { unit: "percent_ftp", value: 0 },
    });
  });
});

describe("convertZwiftPowerRange", () => {
  it("should convert low/high FTP range to percent range", () => {
    const result = convertZwiftPowerRange(0.6, 0.8);

    expect(result).toStrictEqual({
      type: "power",
      value: { unit: "range", min: 60, max: 80 },
    });
  });

  it("should handle warmup range", () => {
    const result = convertZwiftPowerRange(0.25, 0.75);

    expect(result).toStrictEqual({
      type: "power",
      value: { unit: "range", min: 25, max: 75 },
    });
  });

  it("should handle cooldown range (high to low)", () => {
    const result = convertZwiftPowerRange(0.75, 0.5);

    expect(result).toStrictEqual({
      type: "power",
      value: { unit: "range", min: 75, max: 50 },
    });
  });

  it("should handle full FTP range", () => {
    const result = convertZwiftPowerRange(1.0, 1.2);

    expect(result).toStrictEqual({
      type: "power",
      value: { unit: "range", min: 100, max: 120 },
    });
  });
});

describe("convertKrdPowerToZwift", () => {
  it("should convert 85 percent_ftp to 0.85", () => {
    const result = convertKrdPowerToZwift(85);

    expect(result).toBe(0.85);
  });

  it("should convert 100 percent_ftp to 1.0", () => {
    const result = convertKrdPowerToZwift(100);

    expect(result).toBe(1.0);
  });

  it("should convert 150 percent_ftp to 1.5", () => {
    const result = convertKrdPowerToZwift(150);

    expect(result).toBe(1.5);
  });

  it("should convert 50 percent_ftp to 0.5", () => {
    const result = convertKrdPowerToZwift(50);

    expect(result).toBe(0.5);
  });
});

describe("convertKrdPowerRangeToZwift", () => {
  it("should convert percent range to Zwift FTP range", () => {
    const result = convertKrdPowerRangeToZwift(60, 80);

    expect(result).toStrictEqual([0.6, 0.8]);
  });

  it("should handle warmup range", () => {
    const result = convertKrdPowerRangeToZwift(25, 75);

    expect(result).toStrictEqual([0.25, 0.75]);
  });

  it("should handle cooldown range", () => {
    const result = convertKrdPowerRangeToZwift(75, 50);

    expect(result).toStrictEqual([0.75, 0.5]);
  });
});

describe("convertPowerZoneToPercentFtp", () => {
  it("should convert zone 1 to 55%", () => {
    const result = convertPowerZoneToPercentFtp(1);

    expect(result).toBe(55);
  });

  it("should convert zone 2 to 75%", () => {
    const result = convertPowerZoneToPercentFtp(2);

    expect(result).toBe(75);
  });

  it("should convert zone 3 to 90%", () => {
    const result = convertPowerZoneToPercentFtp(3);

    expect(result).toBe(90);
  });

  it("should convert zone 4 to 105%", () => {
    const result = convertPowerZoneToPercentFtp(4);

    expect(result).toBe(105);
  });

  it("should convert zone 5 to 120%", () => {
    const result = convertPowerZoneToPercentFtp(5);

    expect(result).toBe(120);
  });

  it("should convert zone 6 to 150%", () => {
    const result = convertPowerZoneToPercentFtp(6);

    expect(result).toBe(150);
  });

  it("should convert zone 7 to 200%", () => {
    const result = convertPowerZoneToPercentFtp(7);

    expect(result).toBe(200);
  });

  it("should default to 100% for unknown zone", () => {
    const result = convertPowerZoneToPercentFtp(0);

    expect(result).toBe(100);
  });

  it("should default to 100% for zone 8 (out of range)", () => {
    const result = convertPowerZoneToPercentFtp(8);

    expect(result).toBe(100);
  });

  it("should default to 100% for negative zone", () => {
    const result = convertPowerZoneToPercentFtp(-1);

    expect(result).toBe(100);
  });
});
