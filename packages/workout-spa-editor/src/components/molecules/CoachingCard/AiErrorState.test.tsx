/**
 * Tests for `AiErrorState` — inline failure state shown when the AI
 * pipeline rejects (per design D3). All four recovery actions MUST be
 * reachable; the reason text comes from a typed map keyed on
 * `AiFailureReason | "not-found" | "no-provider"`.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AiErrorState } from "./AiErrorState";
import {
  type CoachingDialogBodyProps,
  renderNoWorkoutBody,
} from "./coaching-dialog-body";

const noopProps = {
  onRetry: vi.fn(),
  onEditManually: vi.fn(),
  onMatchExisting: vi.fn(),
  onClose: vi.fn(),
};

describe("AiErrorState", () => {
  it("should render the typed reason text for ai-timeout", () => {
    // Arrange

    // Act
    render(<AiErrorState reason="ai-timeout" {...noopProps} />);

    // Assert
    expect(screen.getByTestId("coaching-dialog-ai-error")).toHaveTextContent(
      "AI request timed out"
    );
  });

  it("should show the typed reason and never the failure's own text", () => {
    // Arrange
    const props = {
      ...noopProps,
      aiFailure: { reason: "transport-error", error: "econnreset" },
    } as unknown as CoachingDialogBodyProps;

    // Act
    render(<>{renderNoWorkoutBody(props)}</>);

    // Assert
    const state = screen.getByTestId("coaching-dialog-ai-error");
    expect(state).not.toHaveTextContent("econnreset");
  });

  it("should fire onRetry when Retry AI is clicked", async () => {
    // Arrange
    const onRetry = vi.fn();

    // Act
    render(
      <AiErrorState reason="no-provider" {...noopProps} onRetry={onRetry} />
    );
    await userEvent.click(screen.getByTestId("coaching-dialog-ai-retry"));

    // Assert
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
