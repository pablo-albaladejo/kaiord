/**
 * Tests for `MatchedActions`: workout-state-conditional buttons (per
 * design D7). Each workout state shapes a different button bar.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { WorkoutState } from "../../../types/calendar-enums";
import type { WorkoutRecord } from "../../../types/calendar-record";
import { MatchedActions } from "./MatchedActions";

const buildWorkout = (state: WorkoutState): WorkoutRecord =>
  ({
    id: "w-1",
    profileId: "p-1",
    source: "kaiord",
    sourceId: "p-1::w-1",
    sport: "cycling",
    state,
    previousState: null,
    raw: { title: "Sweet spot", duration: { value: 3600, unit: "seconds" } },
    krd: null,
    aiMeta: null,
    createdAt: "2026-04-13T08:00:00Z",
    updatedAt: "2026-04-13T08:00:00Z",
    plannedDate: "2026-04-13",
  }) as unknown as WorkoutRecord;

const renderWithState = (state: WorkoutState) =>
  render(
    <MatchedActions
      workout={buildWorkout(state)}
      splitting={false}
      onClose={vi.fn()}
      onOpenEditor={vi.fn()}
      onAiProcess={vi.fn()}
      onPushToGarmin={vi.fn()}
      onSplit={vi.fn()}
    />
  );

describe("MatchedActions", () => {
  it("should render Process with AI for raw workouts", () => {
    // Arrange

    // Act
    renderWithState("raw");

    // Assert
    expect(
      screen.getByTestId("coaching-dialog-ai-process")
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("coaching-dialog-push")
    ).not.toBeInTheDocument();
  });

  it("should render Push to Garmin disabled for structured workouts", () => {
    // Arrange

    // Act
    renderWithState("structured");

    // Assert
    expect(screen.getByTestId("coaching-dialog-push")).toBeDisabled();
  });

  it("should render Push to Garmin disabled for ready workouts (deferred handler)", () => {
    // Arrange
    // Push from the dialog stays disabled until the dialog grows a real
    // push handler — see MatchedActions header comment.

    // Act
    renderWithState("ready");

    // Assert
    expect(screen.getByTestId("coaching-dialog-push")).toBeDisabled();
  });

  it("should hide Push to Garmin for pushed workouts", () => {
    // Arrange

    // Act
    renderWithState("pushed");

    // Assert
    expect(
      screen.queryByTestId("coaching-dialog-push")
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId("coaching-dialog-open-editor")
    ).toBeInTheDocument();
  });

  it("should always render Open editor and Split", () => {
    // Arrange

    // Act
    renderWithState("modified");

    // Assert
    expect(
      screen.getByTestId("coaching-dialog-open-editor")
    ).toBeInTheDocument();
    expect(screen.getByTestId("coaching-dialog-split")).toBeInTheDocument();
  });

  it("should disable the Split button while splitting is in progress", () => {
    // Arrange

    // Act
    render(
      <MatchedActions
        workout={buildWorkout("ready")}
        splitting={true}
        onClose={vi.fn()}
        onOpenEditor={vi.fn()}
        onAiProcess={vi.fn()}
        onPushToGarmin={vi.fn()}
        onSplit={vi.fn()}
      />
    );

    // Assert
    const splitBtn = screen.getByTestId("coaching-dialog-split");
    expect(splitBtn).toBeDisabled();
    expect(splitBtn).toHaveTextContent("Splitting…");
  });
});
