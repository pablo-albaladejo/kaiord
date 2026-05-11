import { describe, expect, it } from "vitest";

import { formatHeartRateTarget, formatPowerTarget } from "./format-power-hr";

const NUMERIC_NON_OBJECT_INPUT = 7;

describe("formatPowerTarget", () => {
  it.each<[string, unknown, string]>([
    ["null input", null, "Power"],
    ["undefined input", undefined, "Power"],
    ["string input", "x", "Power"],
    ["number input", NUMERIC_NON_OBJECT_INPUT, "Power"],
    ["empty object", {}, "Power"],
    ["object missing unit key", { value: 250 }, "Power"],
    ["watts numeric", { unit: "watts", value: 250 }, "250W"],
    ["watts string (rejected)", { unit: "watts", value: "250" }, "Power"],
    ["percent_ftp numeric", { unit: "percent_ftp", value: 85 }, "85% FTP"],
    [
      "percent_ftp string (rejected)",
      { unit: "percent_ftp", value: "85" },
      "Power",
    ],
    ["zone numeric", { unit: "zone", value: 3 }, "Zone 3"],
    ["zone string (rejected)", { unit: "zone", value: "3" }, "Power"],
    [
      "range numeric min/max",
      { unit: "range", min: 200, max: 260 },
      "200-260W",
    ],
    [
      "range with NaN min",
      { unit: "range", min: Number.NaN, max: 260 },
      "Power",
    ],
    ["range missing max", { unit: "range", min: 200 }, "Power"],
    ["range missing min", { unit: "range", max: 260 }, "Power"],
    ["unrecognised unit", { unit: "bpm", value: 150 }, "Power"],
  ])("should format power target for %s", (_label, input, expected) => {
    // Arrange
    const value = input;

    // Act
    const actual = formatPowerTarget(value);

    // Assert
    expect(actual).toBe(expected);
  });
});

describe("formatHeartRateTarget", () => {
  it.each<[string, unknown, string]>([
    ["null input", null, "Heart Rate"],
    ["undefined input", undefined, "Heart Rate"],
    ["string input", "x", "Heart Rate"],
    ["number input", NUMERIC_NON_OBJECT_INPUT, "Heart Rate"],
    ["empty object", {}, "Heart Rate"],
    ["object missing unit key", { value: 150 }, "Heart Rate"],
    ["bpm numeric", { unit: "bpm", value: 150 }, "150 bpm"],
    ["bpm string (rejected)", { unit: "bpm", value: "150" }, "Heart Rate"],
    ["percent_max numeric", { unit: "percent_max", value: 85 }, "85% max"],
    [
      "percent_max string (rejected)",
      { unit: "percent_max", value: "85" },
      "Heart Rate",
    ],
    ["zone numeric", { unit: "zone", value: 4 }, "Zone 4"],
    ["zone string (rejected)", { unit: "zone", value: "4" }, "Heart Rate"],
    [
      "range numeric min/max",
      { unit: "range", min: 140, max: 160 },
      "140-160 bpm",
    ],
    [
      "range with NaN max",
      { unit: "range", min: 140, max: Number.NaN },
      "Heart Rate",
    ],
    ["range missing max", { unit: "range", min: 140 }, "Heart Rate"],
    ["range missing min", { unit: "range", max: 160 }, "Heart Rate"],
    ["unrecognised unit", { unit: "watts", value: 250 }, "Heart Rate"],
  ])("should format heart rate target for %s", (_label, input, expected) => {
    // Arrange
    const value = input;

    // Act
    const actual = formatHeartRateTarget(value);

    // Assert
    expect(actual).toBe(expected);
  });
});
