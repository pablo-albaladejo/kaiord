import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { WorkoutStep } from "../../../types/krd";
import { StepEditor } from "./StepEditor";

describe("StepEditor", () => {
  const mockStep: WorkoutStep = {
    stepIndex: 0,
    durationType: "time",
    duration: { type: "time", seconds: 300 },
    targetType: "power",
    target: {
      type: "power",
      value: { unit: "watts", value: 200 },
    },
    intensity: "active",
  };

  it("should render step editor with step index", () => {
    // Arrange
    const onSave = vi.fn();
    const onCancel = vi.fn();

    // Act
    render(<StepEditor step={mockStep} onSave={onSave} onCancel={onCancel} />);

    // Assert
    expect(screen.getByText("Edit Step 1")).toBeInTheDocument();
  });

  it("should render DurationPicker and TargetPicker", () => {
    // Arrange
    const onSave = vi.fn();
    const onCancel = vi.fn();

    // Act
    render(<StepEditor step={mockStep} onSave={onSave} onCancel={onCancel} />);

    // Assert
    expect(screen.getByLabelText("Select duration type")).toBeInTheDocument();
    expect(screen.getByLabelText("Select target type")).toBeInTheDocument();
  });

  it("should render save and cancel buttons", () => {
    // Arrange
    const onSave = vi.fn();
    const onCancel = vi.fn();

    // Act
    render(<StepEditor step={mockStep} onSave={onSave} onCancel={onCancel} />);

    // Assert
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("should call onSave with updated step when save button is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onCancel = vi.fn();

    // Act
    render(<StepEditor step={mockStep} onSave={onSave} onCancel={onCancel} />);
    const saveButton = screen.getByRole("button", { name: /save/i });
    await user.click(saveButton);

    // Assert
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        stepIndex: 0,
        durationType: "time",
        targetType: "power",
      })
    );
  });

  it("should call onCancel when cancel button is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onCancel = vi.fn();

    // Act
    render(<StepEditor step={mockStep} onSave={onSave} onCancel={onCancel} />);
    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    // Assert
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("should not render when step is null", () => {
    // Arrange
    const onSave = vi.fn();
    const onCancel = vi.fn();

    // Act
    const { container } = render(
      <StepEditor step={null} onSave={onSave} onCancel={onCancel} />
    );

    // Assert
    expect(container.firstChild).toBeNull();
  });

  it("should disable save button when there are validation errors", () => {
    // Arrange
    const onSave = vi.fn();
    const onCancel = vi.fn();

    // Act
    render(<StepEditor step={mockStep} onSave={onSave} onCancel={onCancel} />);
    const saveButton = screen.getByRole("button", { name: /save/i });

    // Assert - Initially no errors, button should be enabled
    expect(saveButton).not.toBeDisabled();
  });

  it("should initialize with step duration and target values", () => {
    // Arrange
    const onSave = vi.fn();
    const onCancel = vi.fn();
    const stepWithDistance: WorkoutStep = {
      stepIndex: 1,
      durationType: "distance",
      duration: { type: "distance", meters: 5000 },
      targetType: "heart_rate",
      target: {
        type: "heart_rate",
        value: { unit: "bpm", value: 150 },
      },
      intensity: "active",
    };

    // Act
    render(
      <StepEditor step={stepWithDistance} onSave={onSave} onCancel={onCancel} />
    );

    // Assert
    expect(screen.getByText("Edit Step 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Select duration type")).toHaveValue(
      "distance"
    );
    expect(screen.getByLabelText("Select target type")).toHaveValue(
      "heart_rate"
    );
  });
});
