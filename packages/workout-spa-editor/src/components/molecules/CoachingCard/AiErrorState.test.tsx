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

  it("should append the optional detail string in parentheses", () => {
    // Arrange

    // Act
    render(
      <AiErrorState
        reason="transport-error"
        detail="econnreset"
        {...noopProps}
      />
    );

    // Assert
    expect(screen.getByTestId("coaching-dialog-ai-error")).toHaveTextContent(
      "(econnreset)"
    );
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
