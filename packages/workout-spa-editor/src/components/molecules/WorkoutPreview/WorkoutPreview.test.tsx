import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { RepetitionBlock, Workout, WorkoutStep } from "../../../types/krd";
import { calculateNormalizedHeight } from "./bar-height";
import { flattenWorkoutSteps } from "./flatten-steps";
import { PREVIEW_TEST } from "./test-fixtures";
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
  target: {
    type: "power",
    value: { unit: "zone", value: PREVIEW_TEST.POWER_ZONE_MID },
  },
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
    // Arrange

    // Act

    const h = calculateNormalizedHeight(
      {
        type: "power",
        value: { unit: "zone", value: PREVIEW_TEST.POWER_ZONE_MID },
      },
      "active"
    );

    // Assert

    expect(h).toBeCloseTo(
      PREVIEW_TEST.POWER_ZONE_MID / PREVIEW_TEST.POWER_ZONE_DENOM
    );
  });

  it("should map power zone 7 to 1.0", () => {
    // Arrange

    // Act

    const h = calculateNormalizedHeight(
      {
        type: "power",
        value: { unit: "zone", value: PREVIEW_TEST.POWER_ZONE_MAX },
      },
      "active"
    );

    // Assert

    expect(h).toBe(PREVIEW_TEST.MAX_HEIGHT_CLAMP);
  });

  it("should map HR zone to height", () => {
    // Arrange

    // Act

    const h = calculateNormalizedHeight(
      {
        type: "heart_rate",
        value: { unit: "zone", value: PREVIEW_TEST.HR_ZONE_VAL },
      },
      "active"
    );

    // Assert

    expect(h).toBeCloseTo(
      PREVIEW_TEST.HR_ZONE_VAL / PREVIEW_TEST.HR_ZONE_DENOM
    );
  });

  it("should map percent_ftp to height", () => {
    // Arrange

    // Act

    const h = calculateNormalizedHeight(
      {
        type: "power",
        value: { unit: "percent_ftp", value: PREVIEW_TEST.PERCENT_FTP_VAL },
      },
      "active"
    );

    // Assert

    expect(h).toBeCloseTo(
      PREVIEW_TEST.PERCENT_FTP_VAL / PREVIEW_TEST.PERCENT_FTP_DENOM
    );
  });

  it("should map watts to height", () => {
    // Arrange

    // Act

    const h = calculateNormalizedHeight(
      {
        type: "power",
        value: { unit: "watts", value: PREVIEW_TEST.WATTS_VAL },
      },
      "active"
    );

    // Assert

    expect(h).toBeCloseTo(PREVIEW_TEST.WATTS_VAL / PREVIEW_TEST.WATTS_DENOM);
  });

  it("should map power range to height using midpoint", () => {
    // Arrange

    // Act

    const h = calculateNormalizedHeight(
      {
        type: "power",
        value: {
          unit: "range",
          min: PREVIEW_TEST.WATTS_RANGE_MIN,
          max: PREVIEW_TEST.WATTS_RANGE_MAX,
        },
      },
      "active"
    );

    // Assert

    expect(h).toBeCloseTo(
      PREVIEW_TEST.WATTS_RANGE_MID / PREVIEW_TEST.WATTS_DENOM
    );
  });

  it("should clamp to minimum 0.15", () => {
    // Arrange

    // Act

    const h = calculateNormalizedHeight(
      {
        type: "power",
        value: { unit: "zone", value: PREVIEW_TEST.POWER_ZONE_LOW },
      },
      "rest"
    );

    // Assert

    expect(h).toBeGreaterThanOrEqual(PREVIEW_TEST.MIN_HEIGHT_CLAMP);
  });

  it("should clamp to maximum 1.0", () => {
    // Arrange

    // Act

    const h = calculateNormalizedHeight(
      {
        type: "power",
        value: { unit: "watts", value: PREVIEW_TEST.WATTS_OVER_MAX },
      },
      "active"
    );

    // Assert

    expect(h).toBe(PREVIEW_TEST.MAX_HEIGHT_CLAMP);
  });

  it("should use intensity fallback for open target", () => {
    // Arrange

    const warmup = calculateNormalizedHeight({ type: "open" }, "warmup");
    const rest = calculateNormalizedHeight({ type: "open" }, "rest");

    // Act

    const active = calculateNormalizedHeight({ type: "open" }, "active");

    // Assert

    expect(warmup).toBe(PREVIEW_TEST.WARMUP_HEIGHT);
    expect(rest).toBe(PREVIEW_TEST.REST_HEIGHT);
    expect(active).toBe(PREVIEW_TEST.ACTIVE_HEIGHT);
  });

  it("should return 0.5 for open target with no intensity", () => {
    // Arrange

    // Act

    const h = calculateNormalizedHeight({ type: "open" }, undefined);

    // Assert

    expect(h).toBe(PREVIEW_TEST.OPEN_FALLBACK_HEIGHT);
  });

  it("should map pace zone to height", () => {
    // Arrange

    // Act

    const h = calculateNormalizedHeight(
      {
        type: "pace",
        value: { unit: "zone", value: PREVIEW_TEST.PACE_ZONE_VAL },
      },
      "active"
    );

    // Assert

    expect(h).toBeCloseTo(
      PREVIEW_TEST.PACE_ZONE_VAL / PREVIEW_TEST.PACE_ZONE_DENOM
    );
  });

  it("should map HR bpm to height", () => {
    // Arrange

    // Act

    const h = calculateNormalizedHeight(
      {
        type: "heart_rate",
        value: { unit: "bpm", value: PREVIEW_TEST.HR_BPM_VAL },
      },
      "active"
    );

    // Assert

    expect(h).toBeCloseTo(PREVIEW_TEST.HR_BPM_VAL / PREVIEW_TEST.HR_BPM_DENOM);
  });

  it("should map HR percent_max to height", () => {
    // Arrange

    // Act

    const h = calculateNormalizedHeight(
      {
        type: "heart_rate",
        value: {
          unit: "percent_max",
          value: PREVIEW_TEST.HR_PERCENT_MAX_VAL,
        },
      },
      "active"
    );

    // Assert

    expect(h).toBeCloseTo(
      PREVIEW_TEST.HR_PERCENT_MAX_VAL / PREVIEW_TEST.HR_PERCENT_MAX_DENOM
    );
  });

  it("should map HR range to height using midpoint", () => {
    // Arrange

    // Act

    const h = calculateNormalizedHeight(
      {
        type: "heart_rate",
        value: {
          unit: "range",
          min: PREVIEW_TEST.HR_RANGE_MIN,
          max: PREVIEW_TEST.HR_RANGE_MAX,
        },
      },
      "active"
    );

    // Assert

    expect(h).toBeCloseTo(
      PREVIEW_TEST.HR_RANGE_MID / PREVIEW_TEST.HR_BPM_DENOM
    );
  });

  it("should map cadence rpm to height", () => {
    // Arrange

    // Act

    const h = calculateNormalizedHeight(
      {
        type: "cadence",
        value: { unit: "rpm", value: PREVIEW_TEST.CADENCE_RPM_VAL },
      },
      "active"
    );

    // Assert

    expect(h).toBeCloseTo(
      PREVIEW_TEST.CADENCE_RPM_VAL / PREVIEW_TEST.CADENCE_RPM_DENOM
    );
  });

  it("should map cadence range to height using midpoint", () => {
    // Arrange

    // Act

    const h = calculateNormalizedHeight(
      {
        type: "cadence",
        value: {
          unit: "range",
          min: PREVIEW_TEST.CADENCE_RANGE_MIN,
          max: PREVIEW_TEST.CADENCE_RANGE_MAX,
        },
      },
      "active"
    );

    // Assert

    expect(h).toBeCloseTo(
      PREVIEW_TEST.CADENCE_RANGE_MID / PREVIEW_TEST.CADENCE_RPM_DENOM
    );
  });

  it("should map pace mps to height", () => {
    // Arrange

    // Act

    const h = calculateNormalizedHeight(
      {
        type: "pace",
        value: { unit: "mps", value: PREVIEW_TEST.PACE_MPS_VAL },
      },
      "active"
    );

    // Assert

    expect(h).toBeCloseTo(
      PREVIEW_TEST.PACE_MPS_VAL / PREVIEW_TEST.PACE_MPS_DENOM
    );
  });

  it("should map pace range to height using midpoint", () => {
    // Arrange

    // Act

    const h = calculateNormalizedHeight(
      {
        type: "pace",
        value: {
          unit: "range",
          min: PREVIEW_TEST.PACE_RANGE_MIN,
          max: PREVIEW_TEST.PACE_RANGE_MAX,
        },
      },
      "active"
    );

    // Assert

    expect(h).toBeCloseTo(
      PREVIEW_TEST.PACE_RANGE_MID / PREVIEW_TEST.PACE_MPS_DENOM
    );
  });

  it("should fall back to intensity for stroke_type target", () => {
    // Arrange

    // Act

    const h = calculateNormalizedHeight(
      { type: "stroke_type", value: { stroke: "freestyle" } } as never,
      "active"
    );

    // Assert

    expect(h).toBe(PREVIEW_TEST.ACTIVE_HEIGHT);
  });
});

describe("flattenWorkoutSteps", () => {
  it("should produce one bar per step", () => {
    // Arrange

    const workout = makeWorkout([
      makeStep(0, PREVIEW_TEST.DURATION_DEFAULT),
      makeStep(1, PREVIEW_TEST.DURATION_LONG),
    ]);

    // Act

    const bars = flattenWorkoutSteps(workout);

    // Assert

    expect(bars).toHaveLength(PREVIEW_TEST.BARS_FROM_TWO_STEPS);
    expect(bars[0].stepId).toBe("step-0");
    expect(bars[1].stepId).toBe("step-1");
  });

  it("should expand RepetitionBlock into individual bars", () => {
    // Arrange

    const block: RepetitionBlock = {
      repeatCount: PREVIEW_TEST.REPEAT_THRICE,
      steps: [
        makeStep(0, PREVIEW_TEST.DURATION_DEFAULT),
        makeStep(1, PREVIEW_TEST.DURATION_LONG),
      ],
    };
    const workout = makeWorkout([block]);

    // Act

    const bars = flattenWorkoutSteps(workout);

    // Assert

    expect(bars).toHaveLength(PREVIEW_TEST.BARS_FROM_REPEAT_3X2);
    bars.forEach((bar) => {
      expect(bar.stepId).toBe("block-0");
    });
  });

  it("should handle mixed steps and blocks", () => {
    // Arrange

    const block: RepetitionBlock = {
      repeatCount: PREVIEW_TEST.REPEAT_TWICE,
      steps: [makeStep(0, PREVIEW_TEST.DURATION_DEFAULT)],
    };
    const workout = makeWorkout([
      makeStep(0, PREVIEW_TEST.DURATION_LONG),
      block,
      makeStep(2, PREVIEW_TEST.DURATION_DEFAULT),
    ]);

    // Act

    const bars = flattenWorkoutSteps(workout);

    // Assert

    expect(bars).toHaveLength(PREVIEW_TEST.BARS_FROM_MIXED);
    expect(bars[0].stepId).toBe("step-0");
    expect(bars[1].stepId).toBe("block-1");
    expect(bars[2].stepId).toBe("block-1");
    expect(bars[3].stepId).toBe("step-2");
  });

  it("should use default duration for non-time steps", () => {
    // Arrange

    const workout = makeWorkout([
      makeStep(0, 0, {
        durationType: "open",
        duration: { type: "open" },
      }),
    ]);

    // Act

    const bars = flattenWorkoutSteps(workout);

    // Assert

    expect(bars[0].durationSeconds).toBe(PREVIEW_TEST.DURATION_DEFAULT);
  });

  it("should return empty for empty workout", () => {
    // Arrange

    const workout = makeWorkout([]);

    // Act

    const bars = flattenWorkoutSteps(workout);

    // Assert

    expect(bars).toHaveLength(PREVIEW_TEST.BARS_EMPTY);
  });

  it("should have unique IDs for repeated bars", () => {
    // Arrange

    const block: RepetitionBlock = {
      repeatCount: PREVIEW_TEST.REPEAT_THRICE,
      steps: [makeStep(0, PREVIEW_TEST.DURATION_DEFAULT)],
    };
    const workout = makeWorkout([block]);

    const bars = flattenWorkoutSteps(workout);

    // Act

    const ids = bars.map((b) => b.id);

    // Assert

    expect(new Set(ids).size).toBe(PREVIEW_TEST.UNIQUE_IDS_REPEAT_3);
  });
});

describe("WorkoutPreview", () => {
  it("should render bars for each step", () => {
    // Arrange
    // Arrange

    const workout = makeWorkout([
      makeStep(0, PREVIEW_TEST.DURATION_DEFAULT),
      makeStep(1, PREVIEW_TEST.DURATION_LONG),
    ]);

    // Act
    render(<WorkoutPreview workout={workout} />);

    // Assert
    const region = screen.getByTestId("workout-preview");

    // Act

    const rects = region.querySelectorAll("rect");

    // Assert

    expect(rects).toHaveLength(PREVIEW_TEST.BARS_FROM_TWO_STEPS);
  });

  it("should return null for empty workout", () => {
    // Arrange
    // Arrange

    const workout = makeWorkout([]);

    // Act

    // Act

    const { container } = render(<WorkoutPreview workout={workout} />);

    // Assert

    // Assert

    expect(container.firstChild).toBeNull();
  });

  it("should highlight selected step bar", () => {
    // Arrange
    // Arrange

    const workout = makeWorkout([
      makeStep(0, PREVIEW_TEST.DURATION_DEFAULT),
      makeStep(1, PREVIEW_TEST.DURATION_LONG),
    ]);

    // Act
    render(<WorkoutPreview workout={workout} selectedStepId="step-0" />);

    // Assert
    const region = screen.getByTestId("workout-preview");

    // Act

    const rects = region.querySelectorAll("rect");

    // Assert

    expect(rects[0].getAttribute("stroke")).toBe(PREVIEW_TEST.SELECTED_STROKE);
    expect(rects[1].getAttribute("stroke")).toBe(
      PREVIEW_TEST.UNSELECTED_STROKE
    );
  });

  it("should call onStepSelect when bar is clicked", () => {
    // Arrange
    // Arrange

    const onSelect = vi.fn();
    const workout = makeWorkout([makeStep(0, PREVIEW_TEST.DURATION_DEFAULT)]);

    // Act
    render(<WorkoutPreview workout={workout} onStepSelect={onSelect} />);
    const region = screen.getByTestId("workout-preview");
    const rect = region.querySelector("rect");

    // Act

    fireEvent.click(rect!);

    // Assert

    // Assert

    expect(onSelect).toHaveBeenCalledWith("step-0");
  });

  it("should expand repetition blocks into multiple bars", () => {
    // Arrange
    // Arrange

    const block: RepetitionBlock = {
      repeatCount: PREVIEW_TEST.REPEAT_FOUR,
      steps: [
        makeStep(0, PREVIEW_TEST.DURATION_SHORT),
        makeStep(1, PREVIEW_TEST.DURATION_MEDIUM),
      ],
    };
    const workout = makeWorkout([block]);

    // Act
    render(<WorkoutPreview workout={workout} />);

    // Assert
    const region = screen.getByTestId("workout-preview");

    // Act

    const rects = region.querySelectorAll("rect");

    // Assert

    expect(rects).toHaveLength(PREVIEW_TEST.BARS_FROM_REPEAT_4X2);
  });

  it("should select block when clicking any repeated bar", () => {
    // Arrange
    // Arrange

    const onSelect = vi.fn();
    const block: RepetitionBlock = {
      repeatCount: PREVIEW_TEST.REPEAT_TWICE,
      steps: [makeStep(0, PREVIEW_TEST.DURATION_SHORT)],
    };
    const workout = makeWorkout([block]);

    // Act
    render(<WorkoutPreview workout={workout} onStepSelect={onSelect} />);
    const region = screen.getByTestId("workout-preview");
    const rects = region.querySelectorAll("rect");

    // Act

    fireEvent.click(rects[1]);

    // Assert

    // Assert

    expect(onSelect).toHaveBeenCalledWith("block-0");
  });

  it("should have proper ARIA role", () => {
    // Arrange
    // Arrange

    const workout = makeWorkout([makeStep(0, PREVIEW_TEST.DURATION_DEFAULT)]);

    // Act

    // Act

    render(<WorkoutPreview workout={workout} />);

    // Assert

    // Assert

    expect(
      screen.getByRole("region", { name: "Workout preview" })
    ).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    // Arrange
    // Arrange

    const workout = makeWorkout([makeStep(0, PREVIEW_TEST.DURATION_DEFAULT)]);

    // Act
    render(<WorkoutPreview workout={workout} className="mt-4" />);

    // Assert

    // Act

    const region = screen.getByTestId("workout-preview");

    // Assert

    expect(region).toHaveClass("mt-4");
  });

  it("should call onStepSelect on Enter key", () => {
    // Arrange
    // Arrange

    const onSelect = vi.fn();
    const workout = makeWorkout([makeStep(0, PREVIEW_TEST.DURATION_DEFAULT)]);

    // Act
    render(<WorkoutPreview workout={workout} onStepSelect={onSelect} />);
    const rect = screen.getByTestId("workout-preview").querySelector("rect")!;

    // Act

    fireEvent.keyDown(rect, { key: "Enter" });

    // Assert

    // Assert

    expect(onSelect).toHaveBeenCalledWith("step-0");
  });

  it("should call onStepSelect on Space key", () => {
    // Arrange
    // Arrange

    const onSelect = vi.fn();
    const workout = makeWorkout([makeStep(0, PREVIEW_TEST.DURATION_DEFAULT)]);

    // Act
    render(<WorkoutPreview workout={workout} onStepSelect={onSelect} />);
    const rect = screen.getByTestId("workout-preview").querySelector("rect")!;

    // Act

    fireEvent.keyDown(rect, { key: " " });

    // Assert

    // Assert

    expect(onSelect).toHaveBeenCalledWith("step-0");
  });

  it("should not throw when onStepSelect is undefined", () => {
    // Arrange
    // Arrange

    const workout = makeWorkout([makeStep(0, PREVIEW_TEST.DURATION_DEFAULT)]);

    // Act
    render(<WorkoutPreview workout={workout} />);

    // Act

    const rect = screen.getByTestId("workout-preview").querySelector("rect")!;

    // Assert

    // Assert

    expect(() => fireEvent.click(rect)).not.toThrow();
  });

  it("should render cadence target steps", () => {
    // Arrange
    // Arrange

    const workout = makeWorkout([
      makeStep(0, PREVIEW_TEST.DURATION_DEFAULT, {
        targetType: "cadence",
        target: {
          type: "cadence",
          value: { unit: "rpm", value: PREVIEW_TEST.CADENCE_RPM_VAL },
        },
      }),
    ]);

    // Act
    render(<WorkoutPreview workout={workout} />);

    // Assert

    // Act

    const rects = screen
      .getByTestId("workout-preview")
      .querySelectorAll("rect");

    // Assert

    expect(rects).toHaveLength(PREVIEW_TEST.BARS_SINGLE);
  });
});
