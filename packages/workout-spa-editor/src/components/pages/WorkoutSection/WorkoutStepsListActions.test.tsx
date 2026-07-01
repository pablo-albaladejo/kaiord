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
      // Arrange

      // Act
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
      // Arrange

      // Act
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
      // Arrange

      // Act
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
      // Arrange

      // Act
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
      // Arrange

      // Act
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
      // Arrange

      // Act
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
      // Arrange

      // Act
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
      // Arrange

      // Act
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
      // Arrange

      // Act
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
      // Arrange

      // Act
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
      const createBlockButton = screen.getByTestId(
        "create-repetition-block-button"
      );
      expect(createBlockButton).toHaveClass("w-full");
      expect(createBlockButton).toHaveClass("sm:w-auto");

      const addStepButton = screen.getByTestId("add-step-button");
      expect(addStepButton).toHaveClass("w-full");
      expect(addStepButton).toHaveClass("sm:w-auto");
    });
  });

  describe("Button interaction flow", () => {
    it("should call onCreateRepetitionBlock when create repetition block button is clicked", async () => {
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
          onPasteStep={vi.fn()}
        />
      );

      // Act
      await user.click(screen.getByTestId("create-repetition-block-button"));

      // Assert
      expect(handleCreateBlock).toHaveBeenCalledOnce();
    });

    it("should call onCreateEmptyRepetitionBlock when create empty repetition block button is clicked", async () => {
      // Arrange
      const handleCreateEmpty = vi.fn();
      const user = userEvent.setup();

      render(
        <WorkoutStepsListActions
          hasMultipleSelection={true}
          selectedStepCount={2}
          onCreateRepetitionBlock={vi.fn()}
          onCreateEmptyRepetitionBlock={handleCreateEmpty}
          onAddStep={vi.fn()}
          onPasteStep={vi.fn()}
        />
      );

      // Act
      await user.click(
        screen.getByTestId("create-empty-repetition-block-button")
      );

      // Assert
      expect(handleCreateEmpty).toHaveBeenCalledOnce();
    });

    it("should call onAddStep when add step button is clicked", async () => {
      // Arrange
      const handleAddStep = vi.fn();
      const user = userEvent.setup();

      render(
        <WorkoutStepsListActions
          hasMultipleSelection={true}
          selectedStepCount={2}
          onCreateRepetitionBlock={vi.fn()}
          onCreateEmptyRepetitionBlock={vi.fn()}
          onAddStep={handleAddStep}
          onPasteStep={vi.fn()}
        />
      );

      // Act
      await user.click(screen.getByTestId("add-step-button"));

      // Assert
      expect(handleAddStep).toHaveBeenCalledOnce();
    });

    it("should call onPasteStep when paste step button is clicked", async () => {
      // Arrange
      const handlePaste = vi.fn();
      const user = userEvent.setup();

      render(
        <WorkoutStepsListActions
          hasMultipleSelection={true}
          selectedStepCount={2}
          onCreateRepetitionBlock={vi.fn()}
          onCreateEmptyRepetitionBlock={vi.fn()}
          onAddStep={vi.fn()}
          onPasteStep={handlePaste}
        />
      );

      // Act
      await user.click(screen.getByTestId("paste-step-button"));

      // Assert
      expect(handlePaste).toHaveBeenCalledOnce();
    });
  });
});
