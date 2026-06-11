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

  it("should render the wrapped step card cleanly", () => {
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
});
