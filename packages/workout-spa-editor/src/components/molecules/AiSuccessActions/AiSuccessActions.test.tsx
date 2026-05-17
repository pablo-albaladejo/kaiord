import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../test-utils";
import type { KRD } from "../../../types/krd";
import { AiSuccessActions } from "./AiSuccessActions";

const sampleWorkout: KRD = {
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-05-17T08:00:00Z", sport: "cycling" },
  extensions: {
    structured_workout: { name: "Generated", sport: "cycling", steps: [] },
  },
};

const renderActions = (
  overrides: Partial<{
    onRegenerate: () => void;
    onEdit: () => void;
    onDiscard: () => void;
  }> = {}
) => {
  const onRegenerate = overrides.onRegenerate ?? vi.fn();
  const onEdit = overrides.onEdit ?? vi.fn();
  const onDiscard = overrides.onDiscard ?? vi.fn();
  renderWithProviders(
    <AiSuccessActions
      workout={sampleWorkout}
      onRegenerate={onRegenerate}
      onEdit={onEdit}
      onDiscard={onDiscard}
    />
  );
  return { onRegenerate, onEdit, onDiscard };
};

describe("AiSuccessActions", () => {
  it("should render all four action buttons (Regenerate / Edit / Discard / Save)", () => {
    // Arrange

    // Act

    renderActions();

    // Assert

    expect(screen.getByTestId("ai-action-regenerate")).toBeInTheDocument();
    expect(screen.getByTestId("ai-action-edit")).toBeInTheDocument();
    expect(screen.getByTestId("ai-action-discard")).toBeInTheDocument();
    expect(screen.getByText("Save to Library")).toBeInTheDocument();
  });

  it("should call onRegenerate when the Regenerate button is clicked", async () => {
    // Arrange

    const user = userEvent.setup();
    const { onRegenerate } = renderActions();

    // Act

    await user.click(screen.getByTestId("ai-action-regenerate"));

    // Assert

    expect(onRegenerate).toHaveBeenCalledTimes(1);
  });

  it("should call onEdit when the Edit button is clicked", async () => {
    // Arrange

    const user = userEvent.setup();
    const { onEdit } = renderActions();

    // Act

    await user.click(screen.getByTestId("ai-action-edit"));

    // Assert

    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("should call onDiscard when the Discard button is clicked", async () => {
    // Arrange

    const user = userEvent.setup();
    const { onDiscard } = renderActions();

    // Act

    await user.click(screen.getByTestId("ai-action-discard"));

    // Assert

    expect(onDiscard).toHaveBeenCalledTimes(1);
  });

  it("should render the Save button labeled with a static title-case 'Save to Library'", () => {
    // Arrange

    renderActions();

    // Act

    const saveButton = screen.getByRole("button", { name: /Save to Library/i });

    // Assert

    expect(saveButton).toBeInTheDocument();
  });
});
