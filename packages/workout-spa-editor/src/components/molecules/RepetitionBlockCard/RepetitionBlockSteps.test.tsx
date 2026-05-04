import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { expectNoReactWarnings } from "../../../test-utils/console-spy";
import type { WorkoutStep } from "../../../types/krd";
import { RepetitionBlockSteps } from "./RepetitionBlockSteps";

describe("RepetitionBlockSteps", () => {
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

  describe("rendering", () => {
    it("should render steps without React warnings", () => {
      // Arrange
      // Arrange

      const warningChecker = expectNoReactWarnings();
      const steps = [mockStep1, mockStep2];

      // Act
      render(<RepetitionBlockSteps steps={steps} />);

      // Assert

      // Act

      const stepCards = screen.getAllByTestId("step-card");

      // Assert

      expect(stepCards).toHaveLength(2);

      warningChecker.verify();
    });

    it("should render with all props without warnings", () => {
      // Arrange
      // Arrange

      const warningChecker = expectNoReactWarnings();
      const steps = [mockStep1, mockStep2];
      const onSelectStep = vi.fn();
      const onToggleStepSelection = vi.fn();
      const onRemoveStep = vi.fn();
      const onDuplicateStep = vi.fn();
      const onAddStep = vi.fn();
      const onReorderSteps = vi.fn();

      // Act
      render(
        <RepetitionBlockSteps
          steps={steps}
          selectedStepIndex={0}
          selectedStepIds={["block-0-step-0"]}
          onSelectStep={onSelectStep}
          onToggleStepSelection={onToggleStepSelection}
          onRemoveStep={onRemoveStep}
          onDuplicateStep={onDuplicateStep}
          onAddStep={onAddStep}
          onReorderSteps={onReorderSteps}
          blockIndex={0}
        />
      );

      // Assert

      // Act

      const stepCards = screen.getAllByTestId("step-card");

      // Assert

      expect(stepCards).toHaveLength(2);

      warningChecker.verify();
    });

    it("should render add step button when onAddStep is provided", () => {
      // Arrange
      // Arrange

      const warningChecker = expectNoReactWarnings();
      const steps = [mockStep1];
      const onAddStep = vi.fn();

      // Act
      render(<RepetitionBlockSteps steps={steps} onAddStep={onAddStep} />);

      // Assert

      // Act

      const addButton = screen.getByTestId("add-step-button");

      // Assert

      expect(addButton).toBeInTheDocument();

      warningChecker.verify();
    });

    it("should not render add step button when onAddStep is not provided", () => {
      // Arrange
      // Arrange

      const warningChecker = expectNoReactWarnings();
      const steps = [mockStep1];

      // Act

      // Act

      render(<RepetitionBlockSteps steps={steps} />);

      // Assert

      // Assert

      expect(screen.queryByTestId("add-step-button")).not.toBeInTheDocument();

      warningChecker.verify();
    });
  });

  describe("prop handling", () => {
    it("should not pass component-specific props to DOM elements", () => {
      // Arrange
      // Arrange

      const warningChecker = expectNoReactWarnings();
      const steps = [mockStep1, mockStep2];
      const onSelectStep = vi.fn();
      const onToggleStepSelection = vi.fn();
      const onRemoveStep = vi.fn();
      const onDuplicateStep = vi.fn();
      const onAddStep = vi.fn();
      const onReorderSteps = vi.fn();

      // Act
      render(
        <RepetitionBlockSteps
          steps={steps}
          selectedStepIndex={0}
          selectedStepIds={["block-0-step-0", "block-0-step-1"]}
          onSelectStep={onSelectStep}
          onToggleStepSelection={onToggleStepSelection}
          onRemoveStep={onRemoveStep}
          onDuplicateStep={onDuplicateStep}
          onAddStep={onAddStep}
          onReorderSteps={onReorderSteps}
          blockIndex={0}
        />
      );

      // Assert - Component should render without warnings

      // Act

      const stepCards = screen.getAllByTestId("step-card");

      // Assert

      expect(stepCards).toHaveLength(2);

      warningChecker.verify();
    });

    it("should handle empty steps array without warnings", () => {
      // Arrange
      // Arrange

      const warningChecker = expectNoReactWarnings();
      const steps: WorkoutStep[] = [];

      // Act
      render(<RepetitionBlockSteps steps={steps} />);

      // Assert

      // Act

      const stepCards = screen.queryAllByTestId("step-card");

      // Assert

      expect(stepCards).toHaveLength(0);

      warningChecker.verify();
    });

    it("should handle single step without warnings", () => {
      // Arrange
      // Arrange

      const warningChecker = expectNoReactWarnings();
      const steps = [mockStep1];

      // Act
      render(<RepetitionBlockSteps steps={steps} blockIndex={0} />);

      // Assert

      // Act

      const stepCards = screen.getAllByTestId("step-card");

      // Assert

      expect(stepCards).toHaveLength(1);

      warningChecker.verify();
    });

    it("should handle multiple selected steps without warnings", () => {
      // Arrange
      // Arrange

      const warningChecker = expectNoReactWarnings();
      const steps = [mockStep1, mockStep2];
      const selectedStepIds = ["block-0-step-0", "block-0-step-1"];

      // Act
      render(
        <RepetitionBlockSteps
          steps={steps}
          selectedStepIds={selectedStepIds}
          blockIndex={0}
        />
      );

      // Assert

      // Act

      const stepCards = screen.getAllByTestId("step-card");

      // Assert

      expect(stepCards).toHaveLength(2);

      warningChecker.verify();
    });
  });
});
