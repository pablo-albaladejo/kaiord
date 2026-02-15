import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { RepetitionBlock, Workout, WorkoutStep } from "../../../types/krd";
import { calculateNormalizedHeight } from "./bar-height";
import { flattenWorkoutSteps } from "./flatten-steps";
import { WorkoutPreview } from "./WorkoutPreview";

const makeStep = (
  stepIndex: number,
  seconds: number,
  opts: Partial<WorkoutStep> = {}
): WorkoutStep => ({
  stepIndex,
  durationType: "time",
  duration: { type: "time", seconds },
  targetType: "power",
  target: { type: "power", value: { unit: "zone", value: 3 } },
  intensity: "active",
  ...opts,
});

const makeWorkout = (steps: Array<WorkoutStep | RepetitionBlock>): Workout => ({
  name: "Test",
  sport: "cycling",
  steps,
});

describe("calculateNormalizedHeight", () => {
  it("should map power zone to height", () => {
    const h = calculateNormalizedHeight(
      { type: "power", value: { unit: "zone", value: 3 } },
      "active"
    );

    expect(h).toBeCloseTo(3 / 7);
  });

  it("should map power zone 7 to 1.0", () => {
    const h = calculateNormalizedHeight(
      { type: "power", value: { unit: "zone", value: 7 } },
      "active"
    );

    expect(h).toBe(1.0);
  });

  it("should map HR zone to height", () => {
    const h = calculateNormalizedHeight(
      { type: "heart_rate", value: { unit: "zone", value: 2 } },
      "active"
    );

    expect(h).toBeCloseTo(2 / 5);
  });

  it("should map percent_ftp to height", () => {
    const h = calculateNormalizedHeight(
      { type: "power", value: { unit: "percent_ftp", value: 100 } },
      "active"
    );

    expect(h).toBeCloseTo(100 / 150);
  });

  it("should map watts to height", () => {
    const h = calculateNormalizedHeight(
      { type: "power", value: { unit: "watts", value: 200 } },
      "active"
    );

    expect(h).toBeCloseTo(200 / 400);
  });

  it("should map power range to height using midpoint", () => {
    const h = calculateNormalizedHeight(
      { type: "power", value: { unit: "range", min: 100, max: 300 } },
      "active"
    );

    expect(h).toBeCloseTo(200 / 400);
  });

  it("should clamp to minimum 0.15", () => {
    const h = calculateNormalizedHeight(
      { type: "power", value: { unit: "zone", value: 1 } },
      "rest"
    );

    expect(h).toBeGreaterThanOrEqual(0.15);
  });

  it("should clamp to maximum 1.0", () => {
    const h = calculateNormalizedHeight(
      { type: "power", value: { unit: "watts", value: 800 } },
      "active"
    );

    expect(h).toBe(1.0);
  });

  it("should use intensity fallback for open target", () => {
    const warmup = calculateNormalizedHeight({ type: "open" }, "warmup");
    const rest = calculateNormalizedHeight({ type: "open" }, "rest");
    const active = calculateNormalizedHeight({ type: "open" }, "active");

    expect(warmup).toBe(0.3);
    expect(rest).toBe(0.2);
    expect(active).toBe(0.6);
  });

  it("should return 0.5 for open target with no intensity", () => {
    const h = calculateNormalizedHeight({ type: "open" }, undefined);

    expect(h).toBe(0.5);
  });

  it("should map pace zone to height", () => {
    const h = calculateNormalizedHeight(
      { type: "pace", value: { unit: "zone", value: 3 } },
      "active"
    );

    expect(h).toBeCloseTo(3 / 5);
  });

  it("should map HR bpm to height", () => {
    const h = calculateNormalizedHeight(
      { type: "heart_rate", value: { unit: "bpm", value: 150 } },
      "active"
    );

    expect(h).toBeCloseTo(150 / 200);
  });

  it("should map HR percent_max to height", () => {
    const h = calculateNormalizedHeight(
      { type: "heart_rate", value: { unit: "percent_max", value: 80 } },
      "active"
    );

    expect(h).toBeCloseTo(80 / 100);
  });

  it("should map HR range to height using midpoint", () => {
    const h = calculateNormalizedHeight(
      { type: "heart_rate", value: { unit: "range", min: 120, max: 160 } },
      "active"
    );

    expect(h).toBeCloseTo(140 / 200);
  });

  it("should map cadence rpm to height", () => {
    const h = calculateNormalizedHeight(
      { type: "cadence", value: { unit: "rpm", value: 90 } },
      "active"
    );

    expect(h).toBeCloseTo(90 / 120);
  });

  it("should map cadence range to height using midpoint", () => {
    const h = calculateNormalizedHeight(
      { type: "cadence", value: { unit: "range", min: 60, max: 100 } },
      "active"
    );

    expect(h).toBeCloseTo(80 / 120);
  });

  it("should map pace mps to height", () => {
    const h = calculateNormalizedHeight(
      { type: "pace", value: { unit: "mps", value: 4 } },
      "active"
    );

    expect(h).toBeCloseTo(4 / 6);
  });

  it("should map pace range to height using midpoint", () => {
    const h = calculateNormalizedHeight(
      { type: "pace", value: { unit: "range", min: 3, max: 5 } },
      "active"
    );

    expect(h).toBeCloseTo(4 / 6);
  });

  it("should fall back to intensity for stroke_type target", () => {
    const h = calculateNormalizedHeight(
      { type: "stroke_type", value: { stroke: "freestyle" } } as never,
      "active"
    );

    expect(h).toBe(0.6);
  });
});

describe("flattenWorkoutSteps", () => {
  it("should produce one bar per step", () => {
    const workout = makeWorkout([makeStep(0, 300), makeStep(1, 600)]);

    const bars = flattenWorkoutSteps(workout);

    expect(bars).toHaveLength(2);
    expect(bars[0].stepId).toBe("step-0");
    expect(bars[1].stepId).toBe("step-1");
  });

  it("should expand RepetitionBlock into individual bars", () => {
    const block: RepetitionBlock = {
      repeatCount: 3,
      steps: [makeStep(0, 300), makeStep(1, 600)],
    };
    const workout = makeWorkout([block]);

    const bars = flattenWorkoutSteps(workout);

    expect(bars).toHaveLength(6);
    bars.forEach((bar) => {
      expect(bar.stepId).toBe("block-0");
    });
  });

  it("should handle mixed steps and blocks", () => {
    const block: RepetitionBlock = {
      repeatCount: 2,
      steps: [makeStep(0, 300)],
    };
    const workout = makeWorkout([makeStep(0, 600), block, makeStep(2, 300)]);

    const bars = flattenWorkoutSteps(workout);

    expect(bars).toHaveLength(4);
    expect(bars[0].stepId).toBe("step-0");
    expect(bars[1].stepId).toBe("block-1");
    expect(bars[2].stepId).toBe("block-1");
    expect(bars[3].stepId).toBe("step-2");
  });

  it("should use default duration for non-time steps", () => {
    const workout = makeWorkout([
      makeStep(0, 0, {
        durationType: "open",
        duration: { type: "open" },
      }),
    ]);

    const bars = flattenWorkoutSteps(workout);

    expect(bars[0].durationSeconds).toBe(300);
  });

  it("should return empty for empty workout", () => {
    const workout = makeWorkout([]);

    const bars = flattenWorkoutSteps(workout);

    expect(bars).toHaveLength(0);
  });

  it("should have unique IDs for repeated bars", () => {
    const block: RepetitionBlock = {
      repeatCount: 3,
      steps: [makeStep(0, 300)],
    };
    const workout = makeWorkout([block]);

    const bars = flattenWorkoutSteps(workout);
    const ids = bars.map((b) => b.id);

    expect(new Set(ids).size).toBe(3);
  });
});

describe("WorkoutPreview", () => {
  it("should render bars for each step", () => {
    // Arrange
    const workout = makeWorkout([makeStep(0, 300), makeStep(1, 600)]);

    // Act
    render(<WorkoutPreview workout={workout} />);

    // Assert
    const region = screen.getByTestId("workout-preview");
    const rects = region.querySelectorAll("rect");
    expect(rects).toHaveLength(2);
  });

  it("should return null for empty workout", () => {
    // Arrange
    const workout = makeWorkout([]);

    // Act
    const { container } = render(<WorkoutPreview workout={workout} />);

    // Assert
    expect(container.firstChild).toBeNull();
  });

  it("should highlight selected step bar", () => {
    // Arrange
    const workout = makeWorkout([makeStep(0, 300), makeStep(1, 600)]);

    // Act
    render(<WorkoutPreview workout={workout} selectedStepId="step-0" />);

    // Assert
    const region = screen.getByTestId("workout-preview");
    const rects = region.querySelectorAll("rect");
    expect(rects[0].getAttribute("stroke")).toBe("#2563eb");
    expect(rects[1].getAttribute("stroke")).toBe("transparent");
  });

  it("should call onStepSelect when bar is clicked", () => {
    // Arrange
    const onSelect = vi.fn();
    const workout = makeWorkout([makeStep(0, 300)]);

    // Act
    render(<WorkoutPreview workout={workout} onStepSelect={onSelect} />);
    const region = screen.getByTestId("workout-preview");
    const rect = region.querySelector("rect");
    fireEvent.click(rect!);

    // Assert
    expect(onSelect).toHaveBeenCalledWith("step-0");
  });

  it("should expand repetition blocks into multiple bars", () => {
    // Arrange
    const block: RepetitionBlock = {
      repeatCount: 4,
      steps: [makeStep(0, 60), makeStep(1, 120)],
    };
    const workout = makeWorkout([block]);

    // Act
    render(<WorkoutPreview workout={workout} />);

    // Assert
    const region = screen.getByTestId("workout-preview");
    const rects = region.querySelectorAll("rect");
    expect(rects).toHaveLength(8);
  });

  it("should select block when clicking any repeated bar", () => {
    // Arrange
    const onSelect = vi.fn();
    const block: RepetitionBlock = {
      repeatCount: 2,
      steps: [makeStep(0, 60)],
    };
    const workout = makeWorkout([block]);

    // Act
    render(<WorkoutPreview workout={workout} onStepSelect={onSelect} />);
    const region = screen.getByTestId("workout-preview");
    const rects = region.querySelectorAll("rect");
    fireEvent.click(rects[1]);

    // Assert
    expect(onSelect).toHaveBeenCalledWith("block-0");
  });

  it("should have proper ARIA role", () => {
    // Arrange
    const workout = makeWorkout([makeStep(0, 300)]);

    // Act
    render(<WorkoutPreview workout={workout} />);

    // Assert
    expect(
      screen.getByRole("region", { name: "Workout preview" })
    ).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    // Arrange
    const workout = makeWorkout([makeStep(0, 300)]);

    // Act
    render(<WorkoutPreview workout={workout} className="mt-4" />);

    // Assert
    const region = screen.getByTestId("workout-preview");
    expect(region).toHaveClass("mt-4");
  });

  it("should call onStepSelect on Enter key", () => {
    // Arrange
    const onSelect = vi.fn();
    const workout = makeWorkout([makeStep(0, 300)]);

    // Act
    render(<WorkoutPreview workout={workout} onStepSelect={onSelect} />);
    const rect = screen.getByTestId("workout-preview").querySelector("rect")!;
    fireEvent.keyDown(rect, { key: "Enter" });

    // Assert
    expect(onSelect).toHaveBeenCalledWith("step-0");
  });

  it("should call onStepSelect on Space key", () => {
    // Arrange
    const onSelect = vi.fn();
    const workout = makeWorkout([makeStep(0, 300)]);

    // Act
    render(<WorkoutPreview workout={workout} onStepSelect={onSelect} />);
    const rect = screen.getByTestId("workout-preview").querySelector("rect")!;
    fireEvent.keyDown(rect, { key: " " });

    // Assert
    expect(onSelect).toHaveBeenCalledWith("step-0");
  });

  it("should not throw when onStepSelect is undefined", () => {
    // Arrange
    const workout = makeWorkout([makeStep(0, 300)]);

    // Act
    render(<WorkoutPreview workout={workout} />);
    const rect = screen.getByTestId("workout-preview").querySelector("rect")!;

    // Assert
    expect(() => fireEvent.click(rect)).not.toThrow();
  });

  it("should render cadence target steps", () => {
    // Arrange
    const workout = makeWorkout([
      makeStep(0, 300, {
        targetType: "cadence",
        target: { type: "cadence", value: { unit: "rpm", value: 90 } },
      }),
    ]);

    // Act
    render(<WorkoutPreview workout={workout} />);

    // Assert
    const rects = screen
      .getByTestId("workout-preview")
      .querySelectorAll("rect");
    expect(rects).toHaveLength(1);
  });
});
