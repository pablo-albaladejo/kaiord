import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { RepetitionBlock, Workout, WorkoutStep } from "../../../types/krd";
import { WorkoutList } from "./WorkoutList";

describe("WorkoutList", () => {
  const createMockStep = (stepIndex: number): WorkoutStep => ({
    stepIndex,
    durationType: "time",
    duration: { type: "time", seconds: 300 },
    targetType: "power",
    target: {
      type: "power",
      value: { unit: "watts", value: 200 },
    },
    intensity: "active",
  });

  const createMockWorkout = (
    steps: Array<WorkoutStep | RepetitionBlock>
  ): Workout => ({
    name: "Test Workout",
    sport: "cycling",
    steps,
  });

  it("should render workout steps", () => {
    // Arrange
    const workout = createMockWorkout([createMockStep(0), createMockStep(1)]);

    // Act
    render(<WorkoutList workout={workout} />);

    // Assert
    expect(
      screen.getByRole("list", { name: "Workout steps" })
    ).toBeInTheDocument();
    expect(screen.getByText("Step 1")).toBeInTheDocument();
    expect(screen.getByText("Step 2")).toBeInTheDocument();
  });

  it("should render repetition blocks with visual grouping", () => {
    // Arrange
    const repetitionBlock: RepetitionBlock = {
      repeatCount: 3,
      steps: [createMockStep(0), createMockStep(1)],
    };
    const workout = createMockWorkout([repetitionBlock]);

    // Act
    render(<WorkoutList workout={workout} />);

    // Assert
    expect(screen.getByText("3x")).toBeInTheDocument(); // RepetitionBlockCard shows count as "3x"
    expect(screen.getByText("Repeat Block")).toBeInTheDocument(); // Badge text
    expect(screen.getByText("Step 1")).toBeInTheDocument();
    expect(screen.getByText("Step 2")).toBeInTheDocument();
  });

  it("should handle step selection", async () => {
    // Arrange
    const user = userEvent.setup();
    const onStepSelect = vi.fn();
    const workout = createMockWorkout([createMockStep(0)]);

    // Act
    render(<WorkoutList workout={workout} onStepSelect={onStepSelect} />);
    const stepCard = screen.getByRole("button", { name: /Step 1/ });
    await user.click(stepCard);

    // Assert
    expect(onStepSelect).toHaveBeenCalledWith(0);
  });

  it("should highlight selected step", () => {
    // Arrange
    const workout = createMockWorkout([createMockStep(0), createMockStep(1)]);

    // Act
    render(
      <WorkoutList workout={workout} selectedStepId="step-time-power-0" />
    );

    // Assert
    const selectedStep = screen.getByRole("button", { name: /Step 1/ });
    expect(selectedStep).toHaveClass("border-primary-500");
  });

  it("should render mixed steps and repetition blocks", () => {
    // Arrange
    const repetitionBlock: RepetitionBlock = {
      repeatCount: 2,
      steps: [createMockStep(1)],
    };
    const workout = createMockWorkout([
      createMockStep(0),
      repetitionBlock,
      createMockStep(2),
    ]);

    // Act
    render(<WorkoutList workout={workout} />);

    // Assert
    expect(screen.getByText("Step 1")).toBeInTheDocument();
    expect(screen.getByText("2x")).toBeInTheDocument(); // RepetitionBlockCard shows count as "2x"
    expect(screen.getByText("Repeat Block")).toBeInTheDocument(); // Badge text
    expect(screen.getByText("Step 2")).toBeInTheDocument();
    expect(screen.getByText("Step 3")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    // Arrange
    const workout = createMockWorkout([createMockStep(0)]);

    // Act
    const { container } = render(
      <WorkoutList workout={workout} className="custom-class" />
    );

    // Assert
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
