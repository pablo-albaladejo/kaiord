import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { expectNoReactWarnings } from "../../../test-utils/console-spy";
import type { RepetitionBlock, WorkoutStep } from "../../../types/krd";
import { RepetitionBlockCard } from "./RepetitionBlockCard";

describe("RepetitionBlockCard", () => {
  const mockStep1: WorkoutStep = {
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
    intensity: "active",
  };

  const mockStep2: WorkoutStep = {
    stepIndex: 1,
    durationType: "time",
    duration: {
      type: "time",
      seconds: 60,
    },
    targetType: "power",
    target: {
      type: "power",
      value: {
        unit: "watts",
        value: 100,
      },
    },
    intensity: "rest",
  };

  const mockBlock: RepetitionBlock = {
    repeatCount: 3,
    steps: [mockStep1, mockStep2],
  };

  describe("rendering", () => {
    it("should render repetition block with repeat count", () => {
      // Arrange & Act
      render(<RepetitionBlockCard block={mockBlock} />);

      // Assert
      expect(screen.getByText("Repeat Block")).toBeInTheDocument();
      expect(screen.getByText("3x")).toBeInTheDocument();
    });

    it("should render step count", () => {
      // Arrange & Act
      render(<RepetitionBlockCard block={mockBlock} />);

      // Assert
      expect(screen.getByText("2 steps")).toBeInTheDocument();
    });

    it("should render single step count correctly", () => {
      // Arrange
      const singleStepBlock: RepetitionBlock = {
        repeatCount: 2,
        steps: [mockStep1],
      };

      // Act
      render(<RepetitionBlockCard block={singleStepBlock} />);

      // Assert
      expect(screen.getByText("1 step")).toBeInTheDocument();
    });

    it("should render nested steps when expanded", () => {
      // Arrange & Act
      render(<RepetitionBlockCard block={mockBlock} />);

      // Assert
      const stepCards = screen.getAllByTestId("step-card");
      expect(stepCards).toHaveLength(2);
    });

    it("should render repeat icon", () => {
      // Arrange & Act
      render(<RepetitionBlockCard block={mockBlock} />);

      // Assert
      const repeatIcon = screen.getByTestId("repetition-block-card");
      expect(repeatIcon).toBeInTheDocument();
    });
  });

  describe("expand/collapse", () => {
    it("should start expanded by default", () => {
      // Arrange & Act
      render(<RepetitionBlockCard block={mockBlock} />);

      // Assert
      const stepCards = screen.getAllByTestId("step-card");
      expect(stepCards).toHaveLength(2);
    });

    it("should collapse when toggle button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<RepetitionBlockCard block={mockBlock} />);

      // Act
      const toggleButton = screen.getByTestId("toggle-expand-button");
      await user.click(toggleButton);

      // Assert
      await waitFor(() => {
        expect(screen.queryAllByTestId("step-card")).toHaveLength(0);
      });
    });

    it("should expand when toggle button is clicked again", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<RepetitionBlockCard block={mockBlock} />);
      const toggleButton = screen.getByTestId("toggle-expand-button");

      // Act - collapse first
      await user.click(toggleButton);
      await waitFor(() => {
        expect(screen.queryAllByTestId("step-card")).toHaveLength(0);
      });

      // Act - expand again
      await user.click(toggleButton);

      // Assert
      await waitFor(() => {
        const stepCards = screen.getAllByTestId("step-card");
        expect(stepCards).toHaveLength(2);
      });
    });

    it("should update aria-label when toggling", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<RepetitionBlockCard block={mockBlock} />);
      const toggleButton = screen.getByTestId("toggle-expand-button");

      // Assert initial state
      expect(toggleButton).toHaveAttribute("aria-label", "Collapse block");

      // Act
      await user.click(toggleButton);

      // Assert collapsed state
      await waitFor(() => {
        expect(toggleButton).toHaveAttribute("aria-label", "Expand block");
      });
    });
  });

  describe("edit repeat count", () => {
    it("should show input when edit button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<RepetitionBlockCard block={mockBlock} />);

      // Act
      const editButton = screen.getByTestId("edit-count-button");
      await user.click(editButton);

      // Assert
      expect(screen.getByTestId("repeat-count-input")).toBeInTheDocument();
      expect(screen.getByTestId("save-count-button")).toBeInTheDocument();
      expect(screen.getByTestId("cancel-count-button")).toBeInTheDocument();
    });

    it("should call onEditRepeatCount when save is clicked", async () => {
      // Arrange
      const onEditRepeatCount = vi.fn();
      const user = userEvent.setup();
      render(
        <RepetitionBlockCard
          block={mockBlock}
          onEditRepeatCount={onEditRepeatCount}
        />
      );

      // Act
      const editButton = screen.getByTestId("edit-count-button");
      await user.click(editButton);

      const input = screen.getByTestId("repeat-count-input");
      await user.clear(input);
      await user.type(input, "5");

      const saveButton = screen.getByTestId("save-count-button");
      await user.click(saveButton);

      // Assert
      expect(onEditRepeatCount).toHaveBeenCalledWith(5);
    });

    it("should hide input after save", async () => {
      // Arrange
      const onEditRepeatCount = vi.fn();
      const user = userEvent.setup();
      render(
        <RepetitionBlockCard
          block={mockBlock}
          onEditRepeatCount={onEditRepeatCount}
        />
      );

      // Act
      const editButton = screen.getByTestId("edit-count-button");
      await user.click(editButton);

      const input = screen.getByTestId("repeat-count-input");
      await user.clear(input);
      await user.type(input, "5");

      const saveButton = screen.getByTestId("save-count-button");
      await user.click(saveButton);

      // Assert
      await waitFor(() => {
        expect(
          screen.queryByTestId("repeat-count-input")
        ).not.toBeInTheDocument();
      });
    });

    it("should cancel edit when cancel button is clicked", async () => {
      // Arrange
      const onEditRepeatCount = vi.fn();
      const user = userEvent.setup();
      render(
        <RepetitionBlockCard
          block={mockBlock}
          onEditRepeatCount={onEditRepeatCount}
        />
      );

      // Act
      const editButton = screen.getByTestId("edit-count-button");
      await user.click(editButton);

      const input = screen.getByTestId("repeat-count-input");
      await user.clear(input);
      await user.type(input, "5");

      const cancelButton = screen.getByTestId("cancel-count-button");
      await user.click(cancelButton);

      // Assert
      expect(onEditRepeatCount).not.toHaveBeenCalled();
      await waitFor(() => {
        expect(
          screen.queryByTestId("repeat-count-input")
        ).not.toBeInTheDocument();
      });
    });

    it("should save on Enter key", async () => {
      // Arrange
      const onEditRepeatCount = vi.fn();
      const user = userEvent.setup();
      render(
        <RepetitionBlockCard
          block={mockBlock}
          onEditRepeatCount={onEditRepeatCount}
        />
      );

      // Act
      const editButton = screen.getByTestId("edit-count-button");
      await user.click(editButton);

      const input = screen.getByTestId("repeat-count-input");
      await user.clear(input);
      await user.type(input, "4{Enter}");

      // Assert
      expect(onEditRepeatCount).toHaveBeenCalledWith(4);
    });

    it("should cancel on Escape key", async () => {
      // Arrange
      const onEditRepeatCount = vi.fn();
      const user = userEvent.setup();
      render(
        <RepetitionBlockCard
          block={mockBlock}
          onEditRepeatCount={onEditRepeatCount}
        />
      );

      // Act
      const editButton = screen.getByTestId("edit-count-button");
      await user.click(editButton);

      const input = screen.getByTestId("repeat-count-input");
      await user.clear(input);
      await user.type(input, "5{Escape}");

      // Assert
      expect(onEditRepeatCount).not.toHaveBeenCalled();
    });

    it("should save valid count (minimum 1)", async () => {
      // Arrange
      const onEditRepeatCount = vi.fn();
      const user = userEvent.setup();
      render(
        <RepetitionBlockCard
          block={mockBlock}
          onEditRepeatCount={onEditRepeatCount}
        />
      );

      // Act
      const editButton = screen.getByTestId("edit-count-button");
      await user.click(editButton);

      const input = screen.getByTestId("repeat-count-input");
      await user.clear(input);
      await user.type(input, "1");

      const saveButton = screen.getByTestId("save-count-button");
      await user.click(saveButton);

      // Assert
      expect(onEditRepeatCount).toHaveBeenCalledWith(1);
    });

    it("should not save invalid count (less than 1)", async () => {
      // Arrange
      const onEditRepeatCount = vi.fn();
      const user = userEvent.setup();
      render(
        <RepetitionBlockCard
          block={mockBlock}
          onEditRepeatCount={onEditRepeatCount}
        />
      );

      // Act
      const editButton = screen.getByTestId("edit-count-button");
      await user.click(editButton);

      const input = screen.getByTestId("repeat-count-input");
      await user.clear(input);
      await user.type(input, "0");

      const saveButton = screen.getByTestId("save-count-button");
      await user.click(saveButton);

      // Assert
      expect(onEditRepeatCount).not.toHaveBeenCalled();
    });

    it("should not save non-numeric value", async () => {
      // Arrange
      const onEditRepeatCount = vi.fn();
      const user = userEvent.setup();
      render(
        <RepetitionBlockCard
          block={mockBlock}
          onEditRepeatCount={onEditRepeatCount}
        />
      );

      // Act
      const editButton = screen.getByTestId("edit-count-button");
      await user.click(editButton);

      const input = screen.getByTestId("repeat-count-input");
      await user.clear(input);
      await user.type(input, "abc");

      const saveButton = screen.getByTestId("save-count-button");
      await user.click(saveButton);

      // Assert
      expect(onEditRepeatCount).not.toHaveBeenCalled();
    });
  });

  describe("step management", () => {
    it("should call onAddStep when add button is clicked", async () => {
      // Arrange
      const onAddStep = vi.fn();
      const user = userEvent.setup();
      render(<RepetitionBlockCard block={mockBlock} onAddStep={onAddStep} />);

      // Act
      const addButton = screen.getByTestId("add-step-button");
      await user.click(addButton);

      // Assert
      expect(onAddStep).toHaveBeenCalledOnce();
    });

    it("should not render add button when onAddStep is not provided", () => {
      // Arrange & Act
      render(<RepetitionBlockCard block={mockBlock} />);

      // Assert
      expect(screen.queryByTestId("add-step-button")).not.toBeInTheDocument();
    });

    it("should call onSelectStep when step is clicked", async () => {
      // Arrange
      const onSelectStep = vi.fn();
      const user = userEvent.setup();
      render(
        <RepetitionBlockCard block={mockBlock} onSelectStep={onSelectStep} />
      );

      // Act
      const stepCards = screen.getAllByTestId("step-card");
      await user.click(stepCards[0]);

      // Assert
      expect(onSelectStep).toHaveBeenCalledWith("block-step-0");
    });

    it("should highlight selected step", () => {
      // Arrange & Act
      render(<RepetitionBlockCard block={mockBlock} selectedStepIndex={0} />);

      // Assert
      const stepCards = screen.getAllByTestId("step-card");
      expect(stepCards[0]).toHaveClass("border-primary-500");
    });
  });

  describe("delete button", () => {
    it("should render delete button in block header", () => {
      // Arrange
      const onDelete = vi.fn();

      // Act
      render(<RepetitionBlockCard block={mockBlock} onDelete={onDelete} />);

      // Assert
      const deleteButton = screen.getByTestId("delete-block-button");
      expect(deleteButton).toBeInTheDocument();
    });

    it("should show tooltip on delete button", async () => {
      // Arrange
      const onDelete = vi.fn();
      const user = userEvent.setup();

      // Act
      render(<RepetitionBlockCard block={mockBlock} onDelete={onDelete} />);
      const deleteButton = screen.getByTestId("delete-block-button");
      await user.hover(deleteButton);

      // Assert
      await waitFor(() => {
        const tooltips = screen.getAllByText("Delete repetition block");
        expect(tooltips.length).toBeGreaterThan(0);
      });
    });

    it("should not render delete button when onDelete is not provided", () => {
      // Arrange & Act
      render(<RepetitionBlockCard block={mockBlock} />);

      // Assert
      expect(
        screen.queryByTestId("delete-block-button")
      ).not.toBeInTheDocument();
    });

    it("should call onDelete when delete button is clicked", async () => {
      // Arrange
      const onDelete = vi.fn();
      const user = userEvent.setup();

      // Act
      render(<RepetitionBlockCard block={mockBlock} onDelete={onDelete} />);
      const deleteButton = screen.getByTestId("delete-block-button");
      await user.click(deleteButton);

      // Assert
      expect(onDelete).toHaveBeenCalledOnce();
    });

    it("should style delete button as destructive variant", () => {
      // Arrange
      const onDelete = vi.fn();

      // Act
      render(<RepetitionBlockCard block={mockBlock} onDelete={onDelete} />);

      // Assert
      const deleteButton = screen.getByTestId("delete-block-button");
      // Check for red/destructive styling classes
      expect(deleteButton).toHaveClass("text-red-600");
    });
  });

  describe("multi-step block rendering", () => {
    /**
     * Validates that `RepetitionBlockCard` renders one card per inner
     * step, independently of stepIndex collisions between blocks. The
     * legacy "block context must be encoded in the ID" contract is gone
     * — each inner step now carries its own stable `ItemId` and the
     * component keys React children by that id rather than a positional
     * `block-N-step-M` string.
     */
    it("renders one step card per inner step of a multi-step block", () => {
      // Arrange
      const blockIndex = 2;
      const multiStepBlock: RepetitionBlock = {
        repeatCount: 3,
        steps: [
          {
            stepIndex: 0,
            durationType: "time",
            duration: { type: "time", seconds: 300 },
            targetType: "power",
            target: {
              type: "power",
              value: { unit: "watts", value: 200 },
            },
            intensity: "active",
          },
          {
            stepIndex: 1,
            durationType: "time",
            duration: { type: "time", seconds: 60 },
            targetType: "power",
            target: {
              type: "power",
              value: { unit: "watts", value: 100 },
            },
            intensity: "rest",
          },
          {
            stepIndex: 2,
            durationType: "distance",
            duration: { type: "distance", meters: 1000 },
            targetType: "heart_rate",
            target: {
              type: "heart_rate",
              value: { unit: "bpm", value: 150 },
            },
            intensity: "active",
          },
        ],
      };

      // Act
      render(
        <RepetitionBlockCard block={multiStepBlock} blockIndex={blockIndex} />
      );

      // Three inner steps → three step-card elements.
      const stepCards = screen.getAllByTestId("step-card");
      expect(stepCards).toHaveLength(3);
    });

    it("renders one step card per block regardless of blockIndex", () => {
      // Arrange
      const block1Index = 1;
      const block2Index = 3;

      const block1: RepetitionBlock = {
        repeatCount: 2,
        steps: [
          {
            stepIndex: 0,
            durationType: "time",
            duration: { type: "time", seconds: 300 },
            targetType: "power",
            target: {
              type: "power",
              value: { unit: "watts", value: 200 },
            },
            intensity: "active",
          },
        ],
      };

      const block2: RepetitionBlock = {
        repeatCount: 2,
        steps: [
          {
            stepIndex: 0,
            durationType: "time",
            duration: { type: "time", seconds: 300 },
            targetType: "power",
            target: {
              type: "power",
              value: { unit: "watts", value: 200 },
            },
            intensity: "active",
          },
        ],
      };

      // Act - Render both blocks
      const { rerender } = render(
        <RepetitionBlockCard block={block1} blockIndex={block1Index} />
      );

      // Assert block 1: one step card rendered.
      let stepCards = screen.getAllByTestId("step-card");
      expect(stepCards).toHaveLength(1);

      // Act - Render block 2
      rerender(<RepetitionBlockCard block={block2} blockIndex={block2Index} />);

      // Assert block 2: one step card rendered. Inner items carry
      // stable ItemIds; no positional `block-N-step-M` string to verify.
      stepCards = screen.getAllByTestId("step-card");
      expect(stepCards).toHaveLength(1);
    });

    it("should handle block without blockIndex gracefully", () => {
      // Arrange
      const block: RepetitionBlock = {
        repeatCount: 2,
        steps: [
          {
            stepIndex: 0,
            durationType: "time",
            duration: { type: "time", seconds: 300 },
            targetType: "power",
            target: {
              type: "power",
              value: { unit: "watts", value: 200 },
            },
            intensity: "active",
          },
        ],
      };

      // Act - Render without blockIndex
      render(<RepetitionBlockCard block={block} />);

      // Assert - component renders and produces the inner step card even
      // when `blockIndex` is omitted; stable `ItemId`s on the inner items
      // carry the identity that used to be encoded in the positional id.
      const stepCards = screen.getAllByTestId("step-card");
      expect(stepCards).toHaveLength(1);
      expect(stepCards[0]).toBeInTheDocument();
    });

    it("renders steps with the same stepIndex in different blocks independently", () => {
      // Step identity is now a stable ItemId — two blocks containing
      // steps with identical `stepIndex` are rendered independently
      // because each step card binds to its own id, not the positional
      // `block-N-step-M` string.
      const step: WorkoutStep = {
        stepIndex: 5,
        durationType: "time",
        duration: { type: "time", seconds: 300 },
        targetType: "power",
        target: {
          type: "power",
          value: { unit: "watts", value: 200 },
        },
        intensity: "active",
      };

      const block: RepetitionBlock = {
        repeatCount: 2,
        steps: [step],
      };

      const { rerender } = render(
        <RepetitionBlockCard block={block} blockIndex={0} />
      );
      expect(screen.getAllByTestId("step-card")).toHaveLength(1);

      rerender(<RepetitionBlockCard block={block} blockIndex={1} />);
      expect(screen.getAllByTestId("step-card")).toHaveLength(1);
    });
  });

  describe("prop handling", () => {
    it("should not pass component-specific props to DOM element", () => {
      // Arrange
      const warningChecker = expectNoReactWarnings();
      const onEditRepeatCount = vi.fn();
      const onAddStep = vi.fn();
      const onRemoveStep = vi.fn();
      const onDuplicateStep = vi.fn();
      const onSelectStep = vi.fn();
      const onToggleStepSelection = vi.fn();
      const onReorderSteps = vi.fn();
      const onUngroup = vi.fn();
      const onDelete = vi.fn();

      // Act
      render(
        <RepetitionBlockCard
          block={mockBlock}
          onEditRepeatCount={onEditRepeatCount}
          onAddStep={onAddStep}
          onRemoveStep={onRemoveStep}
          onDuplicateStep={onDuplicateStep}
          onSelectStep={onSelectStep}
          onToggleStepSelection={onToggleStepSelection}
          onReorderSteps={onReorderSteps}
          onUngroup={onUngroup}
          onDelete={onDelete}
          selectedStepIndex={0}
          selectedStepIds={["step-1"]}
          isDragging={false}
          blockIndex={0}
          data-testid="custom-attr"
        />
      );

      // Assert
      warningChecker.verify();
    });

    it("should forward HTML attributes to DOM element", () => {
      // Arrange
      const warningChecker = expectNoReactWarnings();

      // Act
      render(
        <RepetitionBlockCard
          block={mockBlock}
          data-custom="test-value"
          aria-label="Test block"
          role="region"
        />
      );

      // Assert
      const element = screen.getByTestId("repetition-block-card");
      expect(element).toHaveAttribute("data-custom", "test-value");
      expect(element).toHaveAttribute("aria-label", "Test block");
      expect(element).toHaveAttribute("role", "region");

      warningChecker.verify();
    });

    it("should not produce warnings with all props provided", () => {
      // Arrange
      const warningChecker = expectNoReactWarnings();

      // Act
      render(
        <RepetitionBlockCard
          block={mockBlock}
          onEditRepeatCount={vi.fn()}
          onAddStep={vi.fn()}
          onRemoveStep={vi.fn()}
          onDuplicateStep={vi.fn()}
          onSelectStep={vi.fn()}
          onToggleStepSelection={vi.fn()}
          onReorderSteps={vi.fn()}
          onUngroup={vi.fn()}
          onDelete={vi.fn()}
          selectedStepIndex={0}
          selectedStepIds={["step-1", "step-2"]}
          isDragging={true}
          dragHandleProps={{
            attributes: {
              role: "button",
              tabIndex: 0,
              "aria-disabled": false,
              "aria-pressed": undefined,
              "aria-roledescription": "sortable",
              "aria-describedby": "DndContext-0",
            },
            listeners: {},
          }}
          blockIndex={2}
          className="custom-class"
          data-testid="test-block"
          aria-describedby="description"
        />
      );

      // Assert
      warningChecker.verify();
    });
  });
});
