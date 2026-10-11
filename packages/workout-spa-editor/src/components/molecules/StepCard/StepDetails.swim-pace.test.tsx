/**
 * A pool pace is read per 100 m (per 100 yd in imperial), the way it is
 * typed in the step editor; a run stays per km. The sport comes from the
 * workout in the editor, so the store is seeded with one.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useWorkoutStore } from "../../../store/workout-store";
import type { KRD, WorkoutStep } from "../../../types/krd";
import { formatPaceTarget } from "./format-target";
import { StepDetails } from "./StepDetails";

// 100 m / 1.25 m/s = 80 s per 100 m.
const SWIM_MPS = 1.25;

const paceStep: WorkoutStep = {
  stepIndex: 0,
  durationType: "time",
  duration: { type: "time", seconds: 600 },
  targetType: "pace",
  target: { type: "pace", value: { unit: "mps", value: SWIM_MPS } },
};

const loadSport = (sport: "running" | "swimming") => {
  const krd: KRD = {
    version: "1.0",
    type: "structured_workout",
    metadata: { created: "2026-10-11T00:00:00Z", sport },
    extensions: { structured_workout: { sport, steps: [paceStep] } },
  };
  useWorkoutStore.getState().loadWorkout(krd);
};

describe("swim pace on the step card", () => {
  it("should show a pool pace per 100 m", () => {
    // Arrange
    loadSport("swimming");

    // Act
    render(<StepDetails step={paceStep} />);

    // Assert
    expect(screen.getByText("1:20 min/100 m")).toBeInTheDocument();
  });

  it("should keep a running pace per km", () => {
    // Arrange
    loadSport("running");

    // Act
    render(<StepDetails step={paceStep} />);

    // Assert
    expect(screen.getByText("13:20 min/km")).toBeInTheDocument();
  });

  it("should show an imperial pool pace per 100 yd, faster first in a range", () => {
    // Arrange
    const range = { unit: "range", min: 1.0, max: SWIM_MPS };

    // Act
    const label = formatPaceTarget(range, "imperial", undefined, "swimming");

    // Assert
    expect(label).toBe("1:13-1:31 min/100 yd");
  });
});
