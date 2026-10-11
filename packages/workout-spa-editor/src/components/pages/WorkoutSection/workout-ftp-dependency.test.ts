import { describe, expect, it } from "vitest";

import type { Workout, WorkoutStep } from "../../../types/krd";
import { workoutDependsOnFtp } from "./workout-ftp-dependency";

const step = (target: WorkoutStep["target"], stepIndex = 0): WorkoutStep =>
  ({
    stepIndex,
    durationType: "time",
    duration: { type: "time", seconds: 180 },
    targetType: target.type,
    target,
    intensity: "active",
  }) as WorkoutStep;

const workout = (steps: Workout["steps"]): Workout =>
  ({ sport: "running", steps }) as Workout;

describe("workoutDependsOnFtp", () => {
  it("should not depend on FTP for a pace-only run", () => {
    // Arrange
    const run = workout([
      step({ type: "pace", value: { unit: "mps", value: 3.7 } }),
      step({ type: "open" }, 1),
    ]);

    // Act
    const depends = workoutDependsOnFtp(run);

    // Assert
    expect(depends).toBe(false);
  });

  it("should not depend on FTP for absolute watts", () => {
    // Arrange
    const ride = workout([
      step({ type: "power", value: { unit: "watts", value: 250 } }),
      step({ type: "power", value: { unit: "range", min: 200, max: 240 } }, 1),
    ]);

    // Act
    const depends = workoutDependsOnFtp(ride);

    // Assert
    expect(depends).toBe(false);
  });

  it("should depend on FTP for a percent-of-FTP target", () => {
    // Arrange
    const ride = workout([
      step({ type: "power", value: { unit: "percent_ftp", value: 90 } }),
    ]);

    // Act
    const depends = workoutDependsOnFtp(ride);

    // Assert
    expect(depends).toBe(true);
  });

  it("should depend on FTP for a power zone nested in a repetition block", () => {
    // Arrange
    const ride = workout([
      step({ type: "open" }),
      {
        repeatCount: 4,
        steps: [step({ type: "power", value: { unit: "zone", value: 4 } }, 1)],
      },
    ] as Workout["steps"]);

    // Act
    const depends = workoutDependsOnFtp(ride);

    // Assert
    expect(depends).toBe(true);
  });
});
