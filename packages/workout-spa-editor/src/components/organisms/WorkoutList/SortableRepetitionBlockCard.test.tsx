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

  it("should render the wrapped repetition block card cleanly", () => {
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
});
