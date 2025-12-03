import { DndContext } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoReactWarnings } from "../../../test-utils/console-spy";
import type { WorkoutStep } from "../../../types/krd";
import { SortableStepCard } from "./SortableStepCard";

describe("SortableStepCard", () => {
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
  };

  const renderWithDndContext = (ui: React.ReactElement) => {
    return render(
      <DndContext>
        <SortableContext items={["step-0"]}>{ui}</SortableContext>
      </DndContext>
    );
  };

  describe("prop handling", () => {
    it("should render without React warnings", () => {
      // Arrange
      const warningChecker = expectNoReactWarnings();

      // Act
      renderWithDndContext(
        <SortableStepCard
          id="step-0"
          step={mockStep}
          visualIndex={0}
          isSelected={false}
          isMultiSelected={false}
        />
      );

      // Assert
      expect(screen.getByTestId("step-card")).toBeInTheDocument();
      warningChecker.verify();
    });

    it("should render without warnings when all props provided", () => {
      // Arrange
      const warningChecker = expectNoReactWarnings();
      const mockHandlers = {
        onSelect: () => {},
        onToggleMultiSelect: () => {},
        onDelete: () => {},
        onDuplicate: () => {},
        onCopy: () => {},
      };

      // Act
      renderWithDndContext(
        <SortableStepCard
          id="step-0"
          step={mockStep}
          visualIndex={0}
          isSelected={false}
          isMultiSelected={false}
          {...mockHandlers}
        />
      );

      // Assert
      expect(screen.getByTestId("step-card")).toBeInTheDocument();
      warningChecker.verify();
    });

    it("should not pass dnd-kit specific props to StepCard", () => {
      // Arrange
      const warningChecker = expectNoReactWarnings();

      // Act
      renderWithDndContext(
        <SortableStepCard
          id="step-0"
          step={mockStep}
          visualIndex={0}
          isSelected={false}
          isMultiSelected={false}
        />
      );

      // Assert
      const stepCard = screen.getByTestId("step-card");
      expect(stepCard).toBeInTheDocument();

      // Verify no dnd-kit props leaked to DOM
      expect(stepCard).not.toHaveAttribute("id", "step-0");

      warningChecker.verify();
    });
  });

  describe("HTML attributes", () => {
    it("should forward data-* attributes to wrapper div", () => {
      // Arrange
      const warningChecker = expectNoReactWarnings();

      // Act
      const { container } = renderWithDndContext(
        <SortableStepCard
          id="step-0"
          step={mockStep}
          visualIndex={0}
          isSelected={false}
          isMultiSelected={false}
        />
      );

      // Assert
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toBeInTheDocument();
      warningChecker.verify();
    });

    it("should forward aria-* attributes to wrapper div", () => {
      // Arrange
      const warningChecker = expectNoReactWarnings();

      // Act
      const { container } = renderWithDndContext(
        <SortableStepCard
          id="step-0"
          step={mockStep}
          visualIndex={0}
          isSelected={false}
          isMultiSelected={false}
        />
      );

      // Assert
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toBeInTheDocument();
      warningChecker.verify();
    });
  });
});
