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
    it("should render one card per inner step", () => {
      // Arrange

      const warningChecker = expectNoReactWarnings();
      const steps = [mockStep1, mockStep2];

      // Act

      render(<RepetitionBlockSteps steps={steps} />);

      // Assert

      expect(screen.getAllByTestId("step-card")).toHaveLength(2);
      warningChecker.verify();
    });

    it("should render no cards for an empty steps array", () => {
      // Arrange

      const warningChecker = expectNoReactWarnings();
      const steps: WorkoutStep[] = [];

      // Act

      render(<RepetitionBlockSteps steps={steps} />);

      // Assert

      expect(screen.queryAllByTestId("step-card")).toHaveLength(0);
      warningChecker.verify();
    });

    it("should render the add step button when onAddStep is provided", () => {
      // Arrange

      const onAddStep = vi.fn();
      const steps = [mockStep1];

      // Act

      render(<RepetitionBlockSteps steps={steps} onAddStep={onAddStep} />);

      // Assert

      expect(screen.getByTestId("add-step-button")).toBeInTheDocument();
    });

    it("should not render the add step button when onAddStep is omitted", () => {
      // Arrange

      const steps = [mockStep1];

      // Act

      render(<RepetitionBlockSteps steps={steps} />);

      // Assert

      expect(screen.queryByTestId("add-step-button")).not.toBeInTheDocument();
    });
  });
});
