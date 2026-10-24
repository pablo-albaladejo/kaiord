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
const THREE_MINUTES_S = 180;
const FOUR_STEPS = 4;
const PHASE_STARTED_OFFSET_MS = 5_000;

const run = (update?: AiRunProgress["update"]): AiRunProgress => ({
  modelName: "Claude Sonnet 5",
  startedAt: STARTED_AT,
  phaseStartedAt: STARTED_AT,
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
      items: FOUR_STEPS,
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

  it("should explain a quiet reasoning phase outside the live region", () => {
    // Arrange
    const progress = run({ phase: "reasoning", attempt: 1, maxAttempts: 3 });

    // Act
    render(<AiProcessingOverlay progress={progress} onCancel={vi.fn()} />);

    // Assert
    expect(screen.getByRole("status")).toHaveTextContent(
      "Claude Sonnet 5 is working out how the session is built…"
    );
    expect(
      screen.getByTestId("coaching-dialog-ai-reasoning-hint")
    ).toHaveTextContent("The model reasons before it writes");
  });

  it("should narrate the last finished step while generating", () => {
    // Arrange
    const progress = run({
      phase: "generating",
      attempt: 1,
      maxAttempts: 3,
      items: 2,
      partial: {
        steps: [
          {
            duration: { type: "time", seconds: THREE_MINUTES_S },
            intensity: "active",
          },
          { duration: {} },
        ],
      },
    });

    // Act
    render(<AiProcessingOverlay progress={progress} onCancel={vi.fn()} />);

    // Assert
    expect(screen.getByTestId("coaching-dialog-ai-latest")).toHaveTextContent(
      "Last step: 3 min · Active"
    );
  });

  it("should name the attempt and why the previous one failed", () => {
    // Arrange
    const progress = run({
      phase: "requesting",
      attempt: 2,
      maxAttempts: 3,
      retryReason: "truncated",
    });

    // Act
    render(<AiProcessingOverlay progress={progress} onCancel={vi.fn()} />);

    // Assert
    expect(screen.getByRole("status")).toHaveTextContent(
      "The answer was cut off for length"
    );
    expect(screen.getByTestId("coaching-dialog-ai-attempt")).toHaveTextContent(
      "Attempt 2 of 3 · the last one was cut off for length"
    );
  });

  it("should split the elapsed time between the phase and the whole run", () => {
    // Arrange
    vi.useFakeTimers({ now: STARTED_AT + TWELVE_SECONDS_MS });
    const progress = {
      ...run({
        phase: "generating",
        attempt: 1,
        maxAttempts: 3,
        items: FOUR_STEPS,
      }),
      phaseStartedAt: STARTED_AT + PHASE_STARTED_OFFSET_MS,
    };

    // Act
    render(<AiProcessingOverlay progress={progress} onCancel={vi.fn()} />);

    // Assert
    expect(screen.getByTestId("coaching-dialog-ai-elapsed")).toHaveTextContent(
      "7 s in this phase · 12 s total"
    );
  });
});
