import { DndContext } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoReactWarnings } from "../../../test-utils/console-spy";
import type { RepetitionBlock } from "../../../types/krd";
import { SortableRepetitionBlockCard } from "./SortableRepetitionBlockCard";

describe("SortableRepetitionBlockCard", () => {
  const mockBlock: RepetitionBlock = {
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
      },
    ],
  };

  const mockGenerateStepId = (item: unknown, index: number) => `step-${index}`;

  const renderWithDndContext = (ui: React.ReactElement) => {
    return render(
      <DndContext>
        <SortableContext items={["block-0"]}>{ui}</SortableContext>
      </DndContext>
    );
  };

  describe("prop handling", () => {
    it("should render without React warnings", () => {
      // Arrange
      const warningChecker = expectNoReactWarnings();

      // Act
      renderWithDndContext(
        <SortableRepetitionBlockCard
          id="block-0"
          block={mockBlock}
          blockIndex={0}
          parentBlockIndex={0}
          generateStepId={mockGenerateStepId}
        />
      );

      // Assert
      expect(screen.getByTestId("repetition-block-card")).toBeInTheDocument();
      warningChecker.verify();
    });

    it("should render without warnings when all props provided", () => {
      // Arrange
      const warningChecker = expectNoReactWarnings();
      const mockHandlers = {
        onStepSelect: () => {},
        onToggleStepSelection: () => {},
        onStepDelete: () => {},
        onStepDuplicate: () => {},
        onEditRepeatCount: () => {},
        onAddStep: () => {},
        onUngroup: () => {},
        onDelete: () => {},
        onReorderSteps: () => {},
      };

      // Act
      renderWithDndContext(
        <SortableRepetitionBlockCard
          id="block-0"
          block={mockBlock}
          blockIndex={0}
          parentBlockIndex={0}
          generateStepId={mockGenerateStepId}
          selectedStepId="step-0"
          selectedStepIds={["step-0"]}
          {...mockHandlers}
        />
      );

      // Assert
      expect(screen.getByTestId("repetition-block-card")).toBeInTheDocument();
      warningChecker.verify();
    });

    it("should not pass dnd-kit specific props to RepetitionBlockCard", () => {
      // Arrange
      const warningChecker = expectNoReactWarnings();

      // Act
      renderWithDndContext(
        <SortableRepetitionBlockCard
          id="block-0"
          block={mockBlock}
          blockIndex={0}
          parentBlockIndex={0}
          generateStepId={mockGenerateStepId}
        />
      );

      // Assert
      const blockCard = screen.getByTestId("repetition-block-card");
      expect(blockCard).toBeInTheDocument();

      // Verify no dnd-kit props leaked to DOM
      expect(blockCard).not.toHaveAttribute("id", "block-0");
      expect(blockCard).not.toHaveAttribute("generateStepId");

      warningChecker.verify();
    });
  });

  describe("HTML attributes", () => {
    it("should forward data-* attributes to wrapper div", () => {
      // Arrange
      const warningChecker = expectNoReactWarnings();

      // Act
      const { container } = renderWithDndContext(
        <SortableRepetitionBlockCard
          id="block-0"
          block={mockBlock}
          blockIndex={0}
          parentBlockIndex={0}
          generateStepId={mockGenerateStepId}
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
        <SortableRepetitionBlockCard
          id="block-0"
          block={mockBlock}
          blockIndex={0}
          parentBlockIndex={0}
          generateStepId={mockGenerateStepId}
        />
      );

      // Assert
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toBeInTheDocument();
      warningChecker.verify();
    });
  });
});
