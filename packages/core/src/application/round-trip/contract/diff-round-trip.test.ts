import { describe, expect, it } from "vitest";

import { diffRoundTrip } from "./diff-round-trip";
import type { RoundTripContract } from "./round-trip-contract";

const contract = (
  over: Partial<RoundTripContract> = {}
): RoundTripContract => ({
  format: "fit",
  name: "TEST",
  notCarried: [],
  filledIn: [],
  unsupported: { durations: [], targets: [], intensities: [] },
  sports: { carried: "all", reason: "" },
  ...over,
});

const SECONDS = 60;
const workout = (step: Record<string, unknown>, extra = {}) => ({
  extensions: { structured_workout: { steps: [step] } },
  ...extra,
});
const timed = (seconds: number) => ({
  duration: { type: "time", seconds },
});

describe("diffRoundTrip", () => {
  it("should report nothing when every value is equal or within its tolerance", () => {
    // Arrange
    const before = workout(timed(SECONDS), { name: "x", list: [1, 2] });
    const after = workout(timed(SECONDS + 1), { name: "x", list: [1, 2] });

    // Act
    const result = diffRoundTrip(before, after, contract());

    // Assert
    expect(result.differences).toEqual([]);
  });

  it("should report a number outside its tolerance and a number with no tolerance that moved", () => {
    // Arrange
    const before = workout(timed(SECONDS), { watts: 250 });
    const after = workout(timed(SECONDS + 2), { watts: 251 });

    // Act
    const result = diffRoundTrip(before, after, contract());

    // Assert
    expect(result.differences).toEqual([
      {
        field: "extensions.structured_workout.steps.0.duration.seconds",
        kind: "changed",
        before: SECONDS,
        after: SECONDS + 2,
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
const ZONE = 3;

const targeted = (type: string, unit: string, value: number) =>
  workout({ target: { type, value: { unit, value } } });
const moved = (type: string, unit: string, from: number, to: number) =>
  diffRoundTrip(
    targeted(type, unit, from),
    targeted(type, unit, to),
    contract()
  ).differences.map((d) => d.tolerance);

describe("diffRoundTrip on targets", () => {
  it("should apply a target tolerance only to the target type and units it names", () => {
    // Arrange
    const watts = { from: WATTS, to: WATTS + 1 };
    const zone = { from: ZONE, to: ZONE + 1 };

    // Act
    const results = [
      moved("power", "watts", watts.from, watts.to),
      moved("power", "zone", zone.from, zone.to),
    ];

    // Assert
    expect(results).toEqual([[], [0]]);
  });

  it("should hold heart rate as a share of maximum to the half percent FIT rounds to", () => {
    // Arrange
    const share = { value: 75, half: 75.5, over: 75.6, tolerance: 0.5 };

    // Act
    const results = [
      moved("heart_rate", "percent_max", share.value, share.half),
      moved("heart_rate", "percent_max", share.value, share.over),
      moved("heart_rate", "bpm", share.value, share.value + 1),
    ];

    // Assert
    expect(results).toEqual([[], [share.tolerance], []]);
  });
});
