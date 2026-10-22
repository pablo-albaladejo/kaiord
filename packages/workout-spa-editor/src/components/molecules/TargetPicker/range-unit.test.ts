import { describe, expect, it } from "vitest";

import { getRangeUnit } from "./range-unit";

describe("getRangeUnit", () => {
  it.each([
    {
      name: "a percent_ftp power range",
      target: {
        type: "power",
        value: { unit: "range", min: 50, max: 75, basis: "percent_ftp" },
      },
      expected: "% FTP",
    },
    {
      name: "a basis-less power range",
      target: { type: "power", value: { unit: "range", min: 200, max: 250 } },
      expected: "W",
    },
    {
      name: "a single power value",
      target: { type: "power", value: { unit: "watts", value: 200 } },
      expected: undefined,
    },
    {
      name: "a heart-rate range",
      target: {
        type: "heart_rate",
        value: { unit: "range", min: 130, max: 150 },
      },
      expected: undefined,
    },
    { name: "no target", target: null, expected: undefined },
  ] as const)("should return $expected for $name", ({ target, expected }) => {
    // Arrange
    const value = target as Parameters<typeof getRangeUnit>[0];

    // Act
    const unit = getRangeUnit(value);

    // Assert
    expect(unit).toBe(expected);
  });
});
