import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
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
      expect(onSelectStep).toHaveBeenCalledWith(0);
    });

    it("should highlight selected step", () => {
      // Arrange & Act
      render(<RepetitionBlockCard block={mockBlock} selectedStepIndex={0} />);

      // Assert
      const stepCards = screen.getAllByTestId("step-card");
      expect(stepCards[0]).toHaveClass("border-primary-500");
    });
  });
});
