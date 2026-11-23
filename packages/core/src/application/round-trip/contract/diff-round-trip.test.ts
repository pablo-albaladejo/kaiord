import { describe, expect, it } from "vitest";

import { diffRoundTrip } from "./diff-round-trip";
import type { RoundTripContract } from "./round-trip-contract";

const contract = (
  over: Partial<RoundTripContract> = {}
): RoundTripContract => ({
  format: "test",
  name: "TEST",
  tolerances: [
    { field: "**.seconds", tolerance: 1, reason: "time is kept to ±1 s" },
  ],
  notCarried: [],
  filledIn: [],
  unsupported: { durations: [], targets: [], intensities: [] },
  sports: { carried: "all", reason: "" },
  ...over,
});

describe("diffRoundTrip", () => {
  it("should report nothing when every value is equal or within its tolerance", () => {
    // Arrange
    const before = { a: { seconds: 60 }, name: "x", list: [1, 2] };
    const after = { a: { seconds: 61 }, name: "x", list: [1, 2] };

    // Act
    const result = diffRoundTrip(before, after, contract());

    // Assert
    expect(result.differences).toEqual([]);
  });

  it("should report a number outside its tolerance and a number with no tolerance that moved", () => {
    // Arrange
    const before = { a: { seconds: 60 }, watts: 250 };
    const after = { a: { seconds: 62 }, watts: 251 };

    // Act
    const result = diffRoundTrip(before, after, contract());

    // Assert
    expect(result.differences).toEqual([
      {
        field: "a.seconds",
        kind: "changed",
        before: 60,
        after: 62,
        tolerance: 1,
      },
      {
        field: "watts",
        kind: "changed",
        before: 250,
        after: 251,
        tolerance: 0,
      },
    ]);
  });

  it("should report a value lost and a value added unless the contract declares them", () => {
    // Arrange
    const before = { notes: "n", steps: [{ name: "s" }], kept: "k" };
    const after = { steps: [{ name: "s" }, { name: "t" }], extra: 1 };

    // Act
    const strict = diffRoundTrip(before, after, contract());
    const declared = diffRoundTrip(
      before,
      after,
      contract({
        notCarried: [{ field: "notes", reason: "no field" }],
        filledIn: [{ field: "extra", reason: "a default" }],
      })
    );

    // Assert
    expect(strict.differences.map((d) => `${d.kind} ${d.field}`)).toEqual([
      "missing notes",
      "missing kept",
      "added steps.1.name",
      "added extra",
    ]);
    expect(declared.differences.map((d) => d.field)).toEqual([
      "kept",
      "steps.1.name",
    ]);
    expect(declared.declared).toEqual(["notes", "extra"]);
  });

  it("should compare strings, booleans and empty objects exactly", () => {
    // Arrange
    const before = { sport: "cycling", flag: true, ext: {} };
    const after = { sport: "running", flag: false };

    // Act
    const result = diffRoundTrip(before, after, contract());

    // Assert
    expect(result.differences.map((d) => `${d.kind} ${d.field}`)).toEqual([
      "changed sport",
      "changed flag",
      "missing ext",
    ]);
  });
});

const WATTS = 250;
const WATTS_AFTER = 251;
const ZONE = 3;
const ZONE_AFTER = 4;

describe("diffRoundTrip on targets", () => {
  it("should apply a target tolerance only to the target type and units it names", () => {
    // Arrange
    const rules = contract({
      tolerances: [
        {
          field: "**.target.value.*",
          targetType: "power",
          units: ["watts", "range"],
          tolerance: 1,
          reason: "power is kept to ±1 W",
        },
      ],
    });
    const target = (unit: string, value: number) => ({
      steps: [{ target: { type: "power", value: { unit, value } } }],
    });

    // Act
    const watts = diffRoundTrip(
      target("watts", WATTS),
      target("watts", WATTS_AFTER),
      rules
    );
    const zone = diffRoundTrip(
      target("zone", ZONE),
      target("zone", ZONE_AFTER),
      rules
    );

    // Assert
    expect(watts.differences).toEqual([]);
    expect(zone.differences).toEqual([
      {
        field: "steps.0.target.value.value",
        kind: "changed",
        before: ZONE,
        after: ZONE_AFTER,
        tolerance: 0,
      },
    ]);
  });
});
