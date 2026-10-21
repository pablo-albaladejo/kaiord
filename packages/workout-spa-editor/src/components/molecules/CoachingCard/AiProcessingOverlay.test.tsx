/**
 * Tests for `AiProcessingOverlay` — the body-level progress shown while
 * `convertCoachingActivityWithAi` is in flight (per design D2). The
 * Cancel button MUST always be reachable so users can abort the run.
 */
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AiRunProgress } from "./ai-run-progress";
import { AiProcessingOverlay } from "./AiProcessingOverlay";

const STARTED_AT = Date.parse("2026-10-17T10:00:00Z");
const TWELVE_SECONDS_MS = 12_000;

const run = (update?: AiRunProgress["update"]): AiRunProgress => ({
  modelName: "Claude Sonnet 5",
  startedAt: STARTED_AT,
  update,
});

describe("AiProcessingOverlay", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should render the phase, the elapsed seconds and the Cancel button", () => {
    // Arrange
    const progress = run({ phase: "requesting", attempt: 1, maxAttempts: 3 });

    // Act
    render(<AiProcessingOverlay progress={progress} onCancel={vi.fn()} />);

    // Assert
    expect(screen.getByRole("status")).toHaveTextContent(
      "Waiting for Claude Sonnet 5 to read the description…"
    );
    expect(
      screen.getByTestId("coaching-dialog-ai-elapsed")
    ).toBeInTheDocument();
    expect(screen.getByTestId("coaching-dialog-ai-cancel")).toHaveTextContent(
      "Cancel"
    );
  });

  it("should show the streamed step count outside the live region", () => {
    // Arrange
    const progress = run({
      phase: "generating",
      attempt: 1,
      maxAttempts: 3,
      items: 4,
    });

    // Act
    render(<AiProcessingOverlay progress={progress} onCancel={vi.fn()} />);

    // Assert
    expect(screen.getByTestId("coaching-dialog-ai-steps")).toHaveTextContent(
      "4 steps so far"
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Claude Sonnet 5 is writing the steps…"
    );
    expect(screen.getByRole("status")).not.toHaveTextContent("4 steps");
  });

  it("should count the elapsed seconds from the run start", () => {
    // Arrange
    vi.useFakeTimers({ now: STARTED_AT });
    render(<AiProcessingOverlay progress={run()} onCancel={vi.fn()} />);

    // Act
    act(() => vi.advanceTimersByTime(TWELVE_SECONDS_MS));

    // Assert
    expect(screen.getByTestId("coaching-dialog-ai-elapsed")).toHaveTextContent(
      "12 s"
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Preparing the request…"
    );
  });

  it("should call onCancel when the Cancel button is clicked", async () => {
    // Arrange
    const onCancel = vi.fn();
    render(<AiProcessingOverlay progress={run()} onCancel={onCancel} />);

    // Act
    await userEvent.click(screen.getByTestId("coaching-dialog-ai-cancel"));

    // Assert
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
