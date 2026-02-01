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
    render(<StepCard step={mockStep} />);
    expect(screen.getByText("Step 1")).toBeInTheDocument();
  });

  it("should render intensity badge", () => {
    render(<StepCard step={mockStep} />);
    expect(screen.getByText("warmup")).toBeInTheDocument();
  });

  it("should render duration", () => {
    render(<StepCard step={mockStep} />);
    expect(screen.getByText("5 min")).toBeInTheDocument();
  });

  it("should render target", () => {
    render(<StepCard step={mockStep} />);
    expect(screen.getByText("200W")).toBeInTheDocument();
  });

  it("should render target type badge", () => {
    render(<StepCard step={mockStep} />);
    expect(screen.getByText("power")).toBeInTheDocument();
  });

  it("should render step name when provided", () => {
    const stepWithName: WorkoutStep = {
      ...mockStep,
      name: "Warm Up",
    };
    render(<StepCard step={stepWithName} />);
    expect(screen.getByText("Warm Up")).toBeInTheDocument();
  });

  it("should render notes when provided", () => {
    const stepWithNotes: WorkoutStep = {
      ...mockStep,
      notes: "Easy pace, focus on form",
    };
    render(<StepCard step={stepWithNotes} />);
    expect(screen.getByText("Easy pace, focus on form")).toBeInTheDocument();
  });

  it("should call onSelect when clicked", () => {
    const onSelect = vi.fn();
    render(<StepCard step={mockStep} onSelect={onSelect} />);

    const card = screen.getByRole("button");
    card.click();

    expect(onSelect).toHaveBeenCalledWith(0);
  });

  it("should apply selected styles when isSelected is true", () => {
    render(<StepCard step={mockStep} isSelected={true} />);
    const card = screen.getByRole("button");
    expect(card).toHaveClass("border-primary-500");
  });

  it("should format distance duration correctly", () => {
    const distanceStep: WorkoutStep = {
      ...mockStep,
      durationType: "distance",
      duration: {
        type: "distance",
        meters: 5000,
      },
    };
    render(<StepCard step={distanceStep} />);
    expect(screen.getByText("5.00 km")).toBeInTheDocument();
  });

  it("should format heart rate target correctly", () => {
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
    render(<StepCard step={hrStep} />);
    expect(screen.getByText("150 bpm")).toBeInTheDocument();
  });

  it("should format heart rate zone correctly", () => {
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
    render(<StepCard step={hrZoneStep} />);
    expect(screen.getByText("Zone 3")).toBeInTheDocument();
  });

  it("should format power zone correctly", () => {
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
    render(<StepCard step={powerZoneStep} />);
    expect(screen.getByText("Zone 4")).toBeInTheDocument();
  });

  it("should format FTP percentage correctly", () => {
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
    render(<StepCard step={ftpStep} />);
    expect(screen.getByText("85% FTP")).toBeInTheDocument();
  });

  it("should handle open target type", () => {
    const openStep: WorkoutStep = {
      ...mockStep,
      targetType: "open",
      target: {
        type: "open",
      },
    };
    render(<StepCard step={openStep} />);
    expect(screen.getByText("Open")).toBeInTheDocument();
  });

  it("should handle open duration type", () => {
    const openDurationStep: WorkoutStep = {
      ...mockStep,
      durationType: "open",
      duration: {
        type: "open",
      },
    };
    render(<StepCard step={openDurationStep} />);
    expect(screen.getByText("Open")).toBeInTheDocument();
  });

  it("should format cadence correctly", () => {
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
    render(<StepCard step={cadenceStep} />);
    expect(screen.getByText("90 rpm")).toBeInTheDocument();
  });

  it("should handle keyboard navigation", () => {
    const onSelect = vi.fn();
    render(<StepCard step={mockStep} onSelect={onSelect} />);

    const card = screen.getByRole("button");
    card.focus();
    card.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true })
    );

    expect(onSelect).toHaveBeenCalledWith(0);
  });

  describe("React warnings", () => {
    it("should not produce React warnings when rendering with component props", () => {
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
      render(
        <StepCard
          step={mockStep}
          data-custom="test-value"
          aria-describedby="description-id"
        />
      );

      // Assert
      const card = screen.getByRole("button");
      expect(card).toHaveAttribute("data-custom", "test-value");
      expect(card).toHaveAttribute("aria-describedby", "description-id");
    });
  });

  describe("drag interactions", () => {
    it("should render drag handle when dragHandleProps are provided", () => {
      const dragHandleProps = {
        onPointerDown: vi.fn(),
      };

      render(<StepCard step={mockStep} dragHandleProps={dragHandleProps} />);

      const dragHandle = screen.getByTestId("drag-handle");
      expect(dragHandle).toBeInTheDocument();
      expect(dragHandle).toHaveAttribute("aria-label", "Drag to reorder step");
    });

    it("should not render drag handle when dragHandleProps are not provided", () => {
      render(<StepCard step={mockStep} />);

      const dragHandle = screen.queryByTestId("drag-handle");
      expect(dragHandle).not.toBeInTheDocument();
    });

    it("should apply dragging styles when isDragging is true", () => {
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

      const dragHandle = screen.getByTestId("drag-handle");
      expect(dragHandle).toHaveClass("text-primary-500");
    });

    it("should apply default styles when isDragging is false", () => {
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

      const dragHandle = screen.getByTestId("drag-handle");
      expect(dragHandle).toHaveClass("text-neutral-400");
    });

    it("should apply left padding when drag handle is present", () => {
      const dragHandleProps = {
        onPointerDown: vi.fn(),
      };

      render(<StepCard step={mockStep} dragHandleProps={dragHandleProps} />);

      const card = screen.getByRole("button");
      expect(card).toHaveClass("pl-10");
    });

    it("should not apply left padding when drag handle is not present", () => {
      render(<StepCard step={mockStep} />);

      const card = screen.getByRole("button");
      expect(card).toHaveClass("pb-4");
      expect(card).toHaveClass("px-4"); // px-4 includes both pl-4 and pr-4
      expect(card).toHaveClass("pt-4");
      expect(card).not.toHaveClass("pl-10");
    });

    it("should pass drag handle props to the drag handle element", () => {
      const handlePointerDown = vi.fn();
      const dragHandleProps = {
        onPointerDown: handlePointerDown,
      };

      render(<StepCard step={mockStep} dragHandleProps={dragHandleProps} />);

      const dragHandle = screen.getByTestId("drag-handle");
      dragHandle.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true })
      );

      expect(handlePointerDown).toHaveBeenCalled();
    });
  });
});
