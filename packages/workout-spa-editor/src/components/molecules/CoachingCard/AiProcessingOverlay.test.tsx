/**
 * Tests for `AiProcessingOverlay` — body-level spinner shown while
 * `convertCoachingActivityWithAi` is in flight (per design D2). The
 * Cancel button MUST always be reachable so users can abort the run.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AiProcessingOverlay } from "./AiProcessingOverlay";

describe("AiProcessingOverlay", () => {
  it("should render the spinner and Cancel button", () => {
    // Arrange

    // Act
    render(<AiProcessingOverlay onCancel={vi.fn()} />);

    // Assert
    expect(
      screen.getByTestId("coaching-dialog-ai-processing")
    ).toBeInTheDocument();
    expect(screen.getByTestId("coaching-dialog-ai-cancel")).toBeInTheDocument();
  });

  it("should call onCancel when the Cancel button is clicked", async () => {
    // Arrange
    const onCancel = vi.fn();

    // Act
    render(<AiProcessingOverlay onCancel={onCancel} />);
    await userEvent.click(screen.getByTestId("coaching-dialog-ai-cancel"));

    // Assert
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
