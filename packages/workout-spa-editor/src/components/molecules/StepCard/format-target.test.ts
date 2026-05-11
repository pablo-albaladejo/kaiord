import { describe, expect, it } from "vitest";

import {
  formatCadenceTarget,
  formatHeartRateTarget,
  formatPaceTarget,
  formatPowerTarget,
} from "./format-target";

const NUMERIC_NON_OBJECT_INPUT = 42;

type FormatterCase = [label: string, input: unknown, expected: string];

/**
 * Per-target driver: same `it.each` shape across all four formatters.
 * The fifth "pace" tuple (range numeric min/max) has different formatted
 * output because pace flips min/max — see `mpsToMinPerKm` semantics.
 */
const baseShapeCases = (defaultLabel: string): Array<FormatterCase> => [
  ["null input", null, defaultLabel],
  ["undefined input", undefined, defaultLabel],
  ["string input", "x", defaultLabel],
  ["number input", NUMERIC_NON_OBJECT_INPUT, defaultLabel],
  ["empty object", {}, defaultLabel],
  ["object missing unit key", { value: 250 }, defaultLabel],
];

describe("formatPowerTarget", () => {
  it.each<FormatterCase>([
    ...baseShapeCases("Power"),
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
  it.each<FormatterCase>([
    ...baseShapeCases("Heart Rate"),
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

describe("formatCadenceTarget", () => {
  it.each<FormatterCase>([
    ...baseShapeCases("Cadence"),
    ["rpm with numeric value", { unit: "rpm", value: 90 }, "90 rpm"],
    [
      "rpm with string value (rejected)",
      { unit: "rpm", value: "90" },
      "Cadence",
    ],
    ["rpm without value field", { unit: "rpm" }, "Cadence"],
    [
      "range with numeric min/max",
      { unit: "range", min: 80, max: 100 },
      "80-100 rpm",
    ],
    [
      "range with NaN min",
      { unit: "range", min: Number.NaN, max: 100 },
      "Cadence",
    ],
    ["range missing max", { unit: "range", min: 80 }, "Cadence"],
    ["range missing min", { unit: "range", max: 100 }, "Cadence"],
    ["unrecognised unit", { unit: "watts", value: 90 }, "Cadence"],
  ])("should format %s as expected", (_label, input, expected) => {
    // Arrange
    const value = input;

    // Act
    const actual = formatCadenceTarget(value);

    // Assert
    expect(actual).toBe(expected);
  });
});

describe("formatPaceTarget", () => {
  it.each<FormatterCase>([
    ...baseShapeCases("Pace"),
    // mps -> min/km. 1000/(3.5*60) = 4.7619... -> minutes=4 seconds=Math.round(45.71)=46
    ["mps numeric value", { unit: "mps", value: 3.5 }, "4:46 min/km"],
    ["mps zero (invalid)", { unit: "mps", value: 0 }, "--:-- min/km"],
    ["mps negative (invalid)", { unit: "mps", value: -1 }, "--:-- min/km"],
    [
      "mps Infinity (rejected by isValidNumber)",
      { unit: "mps", value: Number.POSITIVE_INFINITY },
      "Pace",
    ],
    ["mps with string value (rejected)", { unit: "mps", value: "3.5" }, "Pace"],
    // Edge case: seconds rounds to 60 -> minutes+1, "5:00"
    // 1000/(3.3334*60) = 4.99990... -> minutes=4 fractional=0.9999 seconds=Math.round(59.994)=60
    [
      "mps where seconds rounds to 60",
      { unit: "mps", value: 3.3334 },
      "5:00 min/km",
    ],
    ["zone numeric", { unit: "zone", value: 3 }, "Zone 3"],
    ["zone string (rejected)", { unit: "zone", value: "3" }, "Pace"],
    // range: max becomes the faster (smaller min/km), min becomes the slower
    // max=4.0 -> 1000/240 = 4.1666 -> "4:10"; min=3.0 -> 1000/180 = 5.5555 -> "5:33"
    [
      "range numeric min/max (formatted faster-slower)",
      { unit: "range", min: 3.0, max: 4.0 },
      "4:10-5:33 min/km",
    ],
    [
      "range with NaN min",
      { unit: "range", min: Number.NaN, max: 4.0 },
      "Pace",
    ],
    ["range missing max", { unit: "range", min: 3.0 }, "Pace"],
    ["unrecognised unit", { unit: "rpm", value: 90 }, "Pace"],
  ])("should format pace target for %s", (_label, input, expected) => {
    // Arrange
    const value = input;

    // Act
    const actual = formatPaceTarget(value);

    // Assert
    expect(actual).toBe(expected);
  });
});
