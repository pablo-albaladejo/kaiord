import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAiRuntimeStore } from "../../../store/ai-runtime-store";
import { useWorkoutStore } from "../../../store/workout-store";
import { renderWithProviders } from "../../../test-utils";
import type { KRD } from "../../../types/krd";
import { AiSuccessActionsContainer } from "./AiSuccessActionsContainer";

const sampleWorkout: KRD = {
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-05-17T08:00:00Z", sport: "cycling" },
  extensions: {
    structured_workout: { name: "Generated", sport: "cycling", steps: [] },
  },
};

describe("AiSuccessActionsContainer", () => {
  beforeEach(() => {
    useWorkoutStore.setState({ currentWorkout: null });
    useAiRuntimeStore.setState({ generation: { status: "idle" } });
  });

  it("should render nothing when no workout is loaded", () => {
    // Arrange

    // Act

    const { container } = renderWithProviders(
      <AiSuccessActionsContainer onRegenerate={vi.fn()} />
    );

    // Assert

    expect(
      container.querySelector("[data-testid='ai-success-actions']")
    ).toBeNull();
  });

  it("should render the AiSuccessActions row when a workout is loaded", () => {
    // Arrange

    useWorkoutStore.setState({ currentWorkout: sampleWorkout });

    // Act

    renderWithProviders(<AiSuccessActionsContainer onRegenerate={vi.fn()} />);

    // Assert

    expect(screen.getByTestId("ai-success-actions")).toBeInTheDocument();
  });

  it("should reset generation state to idle when Edit is clicked", async () => {
    // Arrange

    useWorkoutStore.setState({ currentWorkout: sampleWorkout });
    useAiRuntimeStore.setState({ generation: { status: "success" } });
    const user = userEvent.setup();
    renderWithProviders(<AiSuccessActionsContainer onRegenerate={vi.fn()} />);

    // Act

    await user.click(screen.getByTestId("ai-action-edit"));

    // Assert

    expect(useAiRuntimeStore.getState().generation.status).toBe("idle");
  });

  it("should clear the workout and reset generation when Discard is clicked", async () => {
    // Arrange

    useWorkoutStore.setState({ currentWorkout: sampleWorkout });
    useAiRuntimeStore.setState({ generation: { status: "success" } });
    const user = userEvent.setup();
    renderWithProviders(<AiSuccessActionsContainer onRegenerate={vi.fn()} />);

    // Act

    await user.click(screen.getByTestId("ai-action-discard"));

    // Assert

    expect(useWorkoutStore.getState().currentWorkout).toBeNull();
    expect(useAiRuntimeStore.getState().generation.status).toBe("idle");
  });

  it("should call onRegenerate when Regenerate is clicked", async () => {
    // Arrange

    useWorkoutStore.setState({ currentWorkout: sampleWorkout });
    const onRegenerate = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <AiSuccessActionsContainer onRegenerate={onRegenerate} />
    );

    // Act

    await user.click(screen.getByTestId("ai-action-regenerate"));

    // Assert

    expect(onRegenerate).toHaveBeenCalledTimes(1);
  });
});
