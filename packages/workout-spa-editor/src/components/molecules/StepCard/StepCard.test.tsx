import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { expectNoReactWarnings } from "../../../test-utils/console-spy";
import type { WorkoutStep } from "../../../types/krd";
import { StepCard } from "./StepCard";

describe("StepCard", () => {
  const mockStep: WorkoutStep = {
    stepIndex: 0,
    durationType: "time",
    duration: {
      type: "time",
      seconds: 300,
    },
    targetType: "power",
    target: {
      type: "power",
      value: {
        unit: "watts",
        value: 200,
      },
    },
    intensity: "warmup",
  };

  it("should render step index", () => {
    // Arrange

    // Act

    render(<StepCard step={mockStep} />);

    // Assert

    expect(screen.getByText("Step 1")).toBeInTheDocument();
  });

  it("should render intensity badge", () => {
    // Arrange

    // Act

    render(<StepCard step={mockStep} />);

    // Assert

    expect(screen.getByText("warmup")).toBeInTheDocument();
  });

  it("should render duration", () => {
    // Arrange

    // Act

    render(<StepCard step={mockStep} />);

    // Assert

    expect(screen.getByText("5 min")).toBeInTheDocument();
  });

  it("should render target", () => {
    // Arrange

    // Act

    render(<StepCard step={mockStep} />);

    // Assert

    expect(screen.getByText("200W")).toBeInTheDocument();
  });

  it("should render target type badge", () => {
    // Arrange

    // Act

    render(<StepCard step={mockStep} />);

    // Assert

    expect(screen.getByText("power")).toBeInTheDocument();
  });

  it("should render step name when provided", () => {
    // Arrange

    const stepWithName: WorkoutStep = {
      ...mockStep,
      name: "Warm Up",
    };

    // Act

    render(<StepCard step={stepWithName} />);

    // Assert

    expect(screen.getByText("Warm Up")).toBeInTheDocument();
  });

  it("should render notes when provided", () => {
    // Arrange

    const stepWithNotes: WorkoutStep = {
      ...mockStep,
      notes: "Easy pace, focus on form",
    };

    // Act

    render(<StepCard step={stepWithNotes} />);

    // Assert

    expect(screen.getByText("Easy pace, focus on form")).toBeInTheDocument();
  });

  it("should call onSelect when clicked", () => {
    // Arrange

    const onSelect = vi.fn();
    render(<StepCard step={mockStep} onSelect={onSelect} />);

    const card = screen.getByRole("button");

    // Act

    card.click();

    // Assert

    expect(onSelect).toHaveBeenCalledWith(0);
  });

  it("should apply selected styles when isSelected is true", () => {
    // Arrange

    render(<StepCard step={mockStep} isSelected={true} />);

    // Act

    const card = screen.getByRole("button");

    // Assert

    expect(card).toHaveClass("border-primary-500");
  });

  it("should format distance duration correctly", () => {
    // Arrange

    const distanceStep: WorkoutStep = {
      ...mockStep,
      durationType: "distance",
      duration: {
        type: "distance",
        meters: 5000,
      },
    };

    // Act

    render(<StepCard step={distanceStep} />);

    // Assert

    expect(screen.getByText("5.00 km")).toBeInTheDocument();
  });

  it("should format heart rate target correctly", () => {
    // Arrange

    const hrStep: WorkoutStep = {
      ...mockStep,
      targetType: "heart_rate",
      target: {
        type: "heart_rate",
        value: {
          unit: "bpm",
          value: 150,
        },
      },
    };

    // Act

    render(<StepCard step={hrStep} />);

    // Assert

    expect(screen.getByText("150 bpm")).toBeInTheDocument();
  });

  it("should format heart rate zone correctly", () => {
    // Arrange

    const hrZoneStep: WorkoutStep = {
      ...mockStep,
      targetType: "heart_rate",
      target: {
        type: "heart_rate",
        value: {
          unit: "zone",
          value: 3,
        },
      },
    };

    // Act

    render(<StepCard step={hrZoneStep} />);

    // Assert

    expect(screen.getByText("Zone 3")).toBeInTheDocument();
  });

  it("should format power zone correctly", () => {
    // Arrange

    const powerZoneStep: WorkoutStep = {
      ...mockStep,
      targetType: "power",
      target: {
        type: "power",
        value: {
          unit: "zone",
          value: 4,
        },
      },
    };

    // Act

    render(<StepCard step={powerZoneStep} />);

    // Assert

    expect(screen.getByText("Zone 4")).toBeInTheDocument();
  });

  it("should format FTP percentage correctly", () => {
    // Arrange

    const ftpStep: WorkoutStep = {
      ...mockStep,
      targetType: "power",
      target: {
        type: "power",
        value: {
          unit: "percent_ftp",
          value: 85,
        },
      },
    };

    // Act

    render(<StepCard step={ftpStep} />);

    // Assert

    expect(screen.getByText("85% FTP")).toBeInTheDocument();
  });

  it("should handle open target type", () => {
    // Arrange

    const openStep: WorkoutStep = {
      ...mockStep,
      targetType: "open",
      target: {
        type: "open",
      },
    };

    // Act

    render(<StepCard step={openStep} />);

    // Assert

    expect(screen.getByText("Open")).toBeInTheDocument();
  });

  it("should handle open duration type", () => {
    // Arrange

    const openDurationStep: WorkoutStep = {
      ...mockStep,
      durationType: "open",
      duration: {
        type: "open",
      },
    };

    // Act

    render(<StepCard step={openDurationStep} />);

    // Assert

    expect(screen.getByText("Open")).toBeInTheDocument();
  });

  it("should format cadence correctly", () => {
    // Arrange

    const cadenceStep: WorkoutStep = {
      ...mockStep,
      targetType: "cadence",
      target: {
        type: "cadence",
        value: {
          unit: "rpm",
          value: 90,
        },
      },
    };

    // Act

    render(<StepCard step={cadenceStep} />);

    // Assert

    expect(screen.getByText("90 rpm")).toBeInTheDocument();
  });

  it("should handle keyboard navigation", () => {
    // Arrange

    const onSelect = vi.fn();
    render(<StepCard step={mockStep} onSelect={onSelect} />);

    const card = screen.getByRole("button");
    card.focus();

    // Act

    card.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true })
    );

    // Assert

    expect(onSelect).toHaveBeenCalledWith(0);
  });

  describe("React warnings", () => {
    it("should not produce React warnings when rendering with component props", () => {
      // Arrange

      // Act

      // Assert

      // Arrange
      const warningChecker = expectNoReactWarnings();

      // Act
      render(
        <StepCard
          step={mockStep}
          visualIndex={1}
          isSelected={true}
          isMultiSelected={false}
          onSelect={vi.fn()}
          onToggleMultiSelect={vi.fn()}
          onDelete={vi.fn()}
          onDuplicate={vi.fn()}
          onCopy={vi.fn()}
          isDragging={false}
          dragHandleProps={{ onPointerDown: vi.fn() }}
        />
      );

      // Assert
      warningChecker.verify();
    });

    it("should forward HTML attributes to DOM element", () => {
      // Arrange & Act
      // Arrange

      render(
        <StepCard
          step={mockStep}
          data-custom="test-value"
          aria-describedby="description-id"
        />
      );

      // Assert

      // Act

      const card = screen.getByRole("button");

      // Assert

      expect(card).toHaveAttribute("data-custom", "test-value");
      expect(card).toHaveAttribute("aria-describedby", "description-id");
    });
  });

  describe("drag interactions", () => {
    it("should render drag handle when dragHandleProps are provided", () => {
      // Arrange

      const dragHandleProps = {
        onPointerDown: vi.fn(),
      };

      render(<StepCard step={mockStep} dragHandleProps={dragHandleProps} />);

      // Act

      const dragHandle = screen.getByTestId("drag-handle");

      // Assert

      expect(dragHandle).toBeInTheDocument();
      expect(dragHandle).toHaveAttribute("aria-label", "Drag to reorder step");
    });

    it("should not render drag handle when dragHandleProps are not provided", () => {
      // Arrange

      render(<StepCard step={mockStep} />);

      // Act

      const dragHandle = screen.queryByTestId("drag-handle");

      // Assert

      expect(dragHandle).not.toBeInTheDocument();
    });

    it("should apply dragging styles when isDragging is true", () => {
      // Arrange

      const dragHandleProps = {
        onPointerDown: vi.fn(),
      };

      render(
        <StepCard
          step={mockStep}
          isDragging={true}
          dragHandleProps={dragHandleProps}
        />
      );

      // Act

      const dragHandle = screen.getByTestId("drag-handle");

      // Assert

      expect(dragHandle).toHaveClass("text-primary-500");
    });

    it("should apply default styles when isDragging is false", () => {
      // Arrange

      const dragHandleProps = {
        onPointerDown: vi.fn(),
      };

      render(
        <StepCard
          step={mockStep}
          isDragging={false}
          dragHandleProps={dragHandleProps}
        />
      );

      // Act

      const dragHandle = screen.getByTestId("drag-handle");

      // Assert

      expect(dragHandle).toHaveClass("text-neutral-400");
    });

    it("should apply left padding when drag handle is present", () => {
      // Arrange

      const dragHandleProps = {
        onPointerDown: vi.fn(),
      };

      render(<StepCard step={mockStep} dragHandleProps={dragHandleProps} />);

      // Act

      const card = screen.getByRole("button");

      // Assert

      expect(card).toHaveClass("pl-10");
    });

    it("should not apply left padding when drag handle is not present", () => {
      // Arrange

      render(<StepCard step={mockStep} />);

      // Act

      const card = screen.getByRole("button");

      // Assert

      expect(card).toHaveClass("pb-4");
      expect(card).toHaveClass("px-4"); // px-4 includes both pl-4 and pr-4
      expect(card).toHaveClass("pt-4");
      expect(card).not.toHaveClass("pl-10");
    });

    it("should pass drag handle props to the drag handle element", () => {
      // Arrange

      const handlePointerDown = vi.fn();
      const dragHandleProps = {
        onPointerDown: handlePointerDown,
      };

      render(<StepCard step={mockStep} dragHandleProps={dragHandleProps} />);

      const dragHandle = screen.getByTestId("drag-handle");

      // Act

      dragHandle.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true })
      );

      // Assert

      expect(handlePointerDown).toHaveBeenCalled();
    });
  });
});
