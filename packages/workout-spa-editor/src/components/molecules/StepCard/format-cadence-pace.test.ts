import { describe, expect, it } from "vitest";

import { formatCadenceTarget, formatPaceTarget } from "./format-cadence-pace";

const NUMERIC_NON_OBJECT_INPUT = 42;

describe("formatCadenceTarget", () => {
  it.each<[string, unknown, string]>([
    ["null input", null, "Cadence"],
    ["undefined input", undefined, "Cadence"],
    ["string input", "rpm", "Cadence"],
    ["number input", NUMERIC_NON_OBJECT_INPUT, "Cadence"],
    ["empty object", {}, "Cadence"],
    ["object missing unit key", { value: 90 }, "Cadence"],
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
  it.each<[string, unknown, string]>([
    ["null input", null, "Pace"],
    ["undefined input", undefined, "Pace"],
    ["string input", "mps", "Pace"],
    ["number input", NUMERIC_NON_OBJECT_INPUT, "Pace"],
    ["empty object", {}, "Pace"],
    ["object missing unit key", { value: 3.5 }, "Pace"],
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
