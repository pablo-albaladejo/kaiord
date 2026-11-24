import { describe, expect, it } from "vitest";

import type { SourceField, SourceValue } from "./first-read-report";
import { firstReadReport } from "./first-read-report";

const krd = {
  extensions: {
    structured_workout: {
      name: "Intervals",
      steps: [
        { duration: { type: "time", seconds: 60 }, intensity: "active" },
        { duration: { type: "time", seconds: 60 }, intensity: "rest" },
      ],
    },
  },
};

const at = (field: string, value: unknown, context = {}): SourceValue => ({
  field,
  value,
  context,
  ancestors: [context],
});

const FIELDS: ReadonlyArray<SourceField> = [
  { source: "Workout.Name", krd: ["extensions.structured_workout.name"] },
  {
    source: "Workout.Step.Seconds",
    krd: ["extensions.structured_workout.**.duration.seconds"],
  },
  {
    source: "Workout.Step.Intensity",
    krd: ["extensions.structured_workout.**.intensity"],
    as: (v) => ({ Active: "active", Resting: "rest" })[String(v)],
  },
  { source: "Workout.Step.StepId", notCarried: "KRD orders steps by list" },
  {
    source: "Workout.Step.Raw",
    sameAs: "Seconds",
    reason: "the raw bytes of Seconds",
  },
];

describe("firstReadReport", () => {
  it("should pass when every source value is in the KRD or declared", () => {
    // Arrange
    const values = [
      at("Workout.Name", "Intervals"),
      at("Workout.Step.Seconds", 60),
      at("Workout.Step.Seconds", 60),
      at("Workout.Step.Intensity", "Active"),
      at("Workout.Step.Intensity", "Resting"),
      at("Workout.Step.StepId", 1),
      at("Workout.Step.Raw", 60000, { Seconds: 60 }),
    ];

    // Act
    const report = firstReadReport(FIELDS, [{ name: "f", values, krd }]);

    // Assert
    expect(report.problems).toEqual([]);
    expect(report.unused).toEqual([]);
  });

  it("should name a source value the first read dropped, counting repeats", () => {
    // Arrange
    const values = [
      at("Workout.Name", "Intervals"),
      at("Workout.Step.Seconds", 60),
      at("Workout.Step.Seconds", 60),
      at("Workout.Step.Seconds", 60),
      at("Workout.Step.Intensity", "Active"),
      at("Workout.Step.Intensity", "Active"),
      at("Workout.Step.StepId", 1),
      at("Workout.Step.Raw", 60000, { Seconds: 60 }),
    ];

    // Act
    const report = firstReadReport(FIELDS, [{ name: "f", values, krd }]);

    // Assert
    expect(report.problems).toEqual([
      "f: Workout.Step.Seconds 60 is not in the KRD after the first read",
      'f: Workout.Step.Intensity "Active" is not in the KRD after the first read',
    ]);
  });

  it("should fail on a source field no rule lists, a sameAs with no partner, and a rule no value used", () => {
    // Arrange
    const values = [
      at("Workout.Name", "Intervals"),
      at("Workout.Step.Seconds", 60),
      at("Workout.Step.Intensity", "Active"),
      at("Workout.Step.Raw", 60000, {}),
      at("Workout.Creator", "Garmin"),
    ];

    // Act
    const report = firstReadReport(FIELDS, [{ name: "f", values, krd }]);

    // Assert
    expect(report.problems).toEqual([
      "f: Workout.Step.Raw 60000 is read as Seconds, which the source does not hold",
      'f: Workout.Creator "Garmin" is listed neither as carried nor as not carried',
    ]);
    expect(report.unused).toEqual(["Workout.Step.StepId"]);
  });

  it("should apply a rule only when its condition holds", () => {
    // Arrange
    const fields: ReadonlyArray<SourceField> = [
      {
        source: "Step.@Duration",
        when: (c) => c.original !== undefined,
        notCarried: "a placeholder for the original duration",
      },
      {
        source: "Step.@Duration",
        krd: ["extensions.structured_workout.**.duration.seconds"],
      },
    ];
    const values = [
      at("Step.@Duration", 300, { original: "distance" }),
      at("Step.@Duration", 60, {}),
    ];

    // Act
    const report = firstReadReport(fields, [{ name: "f", values, krd }]);

    // Assert
    expect(report.problems).toEqual([]);
    expect(report.unused).toEqual([]);
  });
});
