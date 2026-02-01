import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { WorkoutStepsListActions } from "./WorkoutStepsListActions";

/**
 * WorkoutStepsListActions Integration Tests
 *
 * Tests the integration of CreateRepetitionBlockButton with WorkoutStepsList:
 * - Button visibility based on selection count
 * - Button click opens dialog
 * - Mobile responsiveness
 * - Accessibility
 *
 * Requirements: 7.1
 */
describe("WorkoutStepsListActions", () => {
  describe("CreateRepetitionBlockButton integration", () => {
    it("should not show create repetition block button when no steps selected", () => {
      // Arrange & Act
      render(
        <WorkoutStepsListActions
          hasMultipleSelection={false}
          selectedStepCount={0}
          onCreateRepetitionBlock={vi.fn()}
          onCreateEmptyRepetitionBlock={vi.fn()}
          onAddStep={vi.fn()}
        />
      );

      // Assert
      expect(
        screen.queryByTestId("create-repetition-block-button")
      ).not.toBeInTheDocument();
    });

    it("should not show create repetition block button when only 1 step selected", () => {
      // Arrange & Act
      render(
        <WorkoutStepsListActions
          hasMultipleSelection={false}
          selectedStepCount={1}
          onCreateRepetitionBlock={vi.fn()}
          onCreateEmptyRepetitionBlock={vi.fn()}
          onAddStep={vi.fn()}
        />
      );

      // Assert
      expect(
        screen.queryByTestId("create-repetition-block-button")
      ).not.toBeInTheDocument();
    });

    it("should show selection hint when 1 step selected", () => {
      // Arrange & Act
      render(
        <WorkoutStepsListActions
          hasMultipleSelection={false}
          selectedStepCount={1}
          onCreateRepetitionBlock={vi.fn()}
          onCreateEmptyRepetitionBlock={vi.fn()}
          onAddStep={vi.fn()}
        />
      );

      // Assert
      expect(screen.getByTestId("selection-hint")).toBeInTheDocument();
      expect(screen.getByTestId("selection-hint")).toHaveTextContent(
        /Ctrl\+click another step/
      );
    });

    it("should show create repetition block button when 2 steps selected", () => {
      // Arrange & Act
      render(
        <WorkoutStepsListActions
          hasMultipleSelection={true}
          selectedStepCount={2}
          onCreateRepetitionBlock={vi.fn()}
          onCreateEmptyRepetitionBlock={vi.fn()}
          onAddStep={vi.fn()}
        />
      );

      // Assert
      const button = screen.getByTestId("create-repetition-block-button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("Create Repetition Block (2 steps)");
    });

    it("should show create repetition block button when 3+ steps selected", () => {
      // Arrange & Act
      render(
        <WorkoutStepsListActions
          hasMultipleSelection={true}
          selectedStepCount={5}
          onCreateRepetitionBlock={vi.fn()}
          onCreateEmptyRepetitionBlock={vi.fn()}
          onAddStep={vi.fn()}
        />
      );

      // Assert
      const button = screen.getByTestId("create-repetition-block-button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("Create Repetition Block (5 steps)");
    });

    it("should call onCreateRepetitionBlock when button clicked", async () => {
      // Arrange
      const handleCreateBlock = vi.fn();
      const user = userEvent.setup();

      render(
        <WorkoutStepsListActions
          hasMultipleSelection={true}
          selectedStepCount={2}
          onCreateRepetitionBlock={handleCreateBlock}
          onCreateEmptyRepetitionBlock={vi.fn()}
          onAddStep={vi.fn()}
        />
      );

      // Act
      const button = screen.getByTestId("create-repetition-block-button");
      await user.click(button);

      // Assert
      expect(handleCreateBlock).toHaveBeenCalledOnce();
    });

    it("should have proper accessibility attributes", () => {
      // Arrange & Act
      render(
        <WorkoutStepsListActions
          hasMultipleSelection={true}
          selectedStepCount={3}
          onCreateRepetitionBlock={vi.fn()}
          onCreateEmptyRepetitionBlock={vi.fn()}
          onAddStep={vi.fn()}
        />
      );

      // Assert
      const button = screen.getByTestId("create-repetition-block-button");
      expect(button).toHaveAttribute(
        "aria-label",
        "Create repetition block from selected steps"
      );
    });
  });

  describe("Button layout and responsiveness", () => {
    it("should render all action buttons", () => {
      // Arrange & Act
      render(
        <WorkoutStepsListActions
          hasMultipleSelection={false}
          selectedStepCount={0}
          onCreateRepetitionBlock={vi.fn()}
          onCreateEmptyRepetitionBlock={vi.fn()}
          onAddStep={vi.fn()}
        />
      );

      // Assert
      expect(
        screen.getByTestId("create-empty-repetition-block-button")
      ).toBeInTheDocument();
      expect(screen.getByTestId("add-step-button")).toBeInTheDocument();
    });

    it("should render paste button when onPasteStep provided", () => {
      // Arrange & Act
      render(
        <WorkoutStepsListActions
          hasMultipleSelection={false}
          selectedStepCount={0}
          onCreateRepetitionBlock={vi.fn()}
          onCreateEmptyRepetitionBlock={vi.fn()}
          onAddStep={vi.fn()}
          onPasteStep={vi.fn()}
        />
      );

      // Assert
      expect(screen.getByTestId("paste-step-button")).toBeInTheDocument();
    });

    it("should not render paste button when onPasteStep not provided", () => {
      // Arrange & Act
      render(
        <WorkoutStepsListActions
          hasMultipleSelection={false}
          selectedStepCount={0}
          onCreateRepetitionBlock={vi.fn()}
          onCreateEmptyRepetitionBlock={vi.fn()}
          onAddStep={vi.fn()}
        />
      );

      // Assert
      expect(screen.queryByTestId("paste-step-button")).not.toBeInTheDocument();
    });

    it("should have responsive classes for mobile", () => {
      // Arrange & Act
      render(
        <WorkoutStepsListActions
          hasMultipleSelection={true}
          selectedStepCount={2}
          onCreateRepetitionBlock={vi.fn()}
          onCreateEmptyRepetitionBlock={vi.fn()}
          onAddStep={vi.fn()}
        />
      );

      // Assert - Buttons have responsive width classes
      const createBlockButton = screen.getByTestId(
        "create-repetition-block-button"
      );
      expect(createBlockButton).toHaveClass("w-full");
      expect(createBlockButton).toHaveClass("sm:w-auto");

      // Assert - Add step button also has responsive classes
      const addStepButton = screen.getByTestId("add-step-button");
      expect(addStepButton).toHaveClass("w-full");
      expect(addStepButton).toHaveClass("sm:w-auto");
    });
  });

  describe("Button interaction flow", () => {
    it("should call correct handlers for each button", async () => {
      // Arrange
      const handleCreateBlock = vi.fn();
      const handleCreateEmpty = vi.fn();
      const handleAddStep = vi.fn();
      const handlePaste = vi.fn();
      const user = userEvent.setup();

      render(
        <WorkoutStepsListActions
          hasMultipleSelection={true}
          selectedStepCount={2}
          onCreateRepetitionBlock={handleCreateBlock}
          onCreateEmptyRepetitionBlock={handleCreateEmpty}
          onAddStep={handleAddStep}
          onPasteStep={handlePaste}
        />
      );

      // Act & Assert - Create repetition block
      await user.click(screen.getByTestId("create-repetition-block-button"));
      expect(handleCreateBlock).toHaveBeenCalledOnce();

      // Act & Assert - Create empty repetition block
      await user.click(
        screen.getByTestId("create-empty-repetition-block-button")
      );
      expect(handleCreateEmpty).toHaveBeenCalledOnce();

      // Act & Assert - Add step
      await user.click(screen.getByTestId("add-step-button"));
      expect(handleAddStep).toHaveBeenCalledOnce();

      // Act & Assert - Paste
      await user.click(screen.getByTestId("paste-step-button"));
      expect(handlePaste).toHaveBeenCalledOnce();
    });
  });
});
