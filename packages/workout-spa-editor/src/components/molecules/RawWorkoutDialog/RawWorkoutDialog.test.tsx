import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import type { WorkoutRecord } from "../../../types/calendar-record";
import { RawWorkoutDialog } from "./RawWorkoutDialog";

function renderWithRouter(ui: React.ReactNode, path = "/calendar") {
  const loc = memoryLocation({ path, record: true });
  return {
    ...render(<Router hook={loc.hook}>{ui}</Router>),
    location: loc,
  };
}

const now = new Date().toISOString();

function makeWorkout(overrides: Partial<WorkoutRecord> = {}): WorkoutRecord {
  return {
    id: "w-1",
    date: "2025-03-15",
    sport: "Running",
    source: "garmin",
    sourceId: null,
    planId: null,
    state: "raw",
    raw: {
      title: "Easy Run",
      description: "Coach says: take it easy today.",
      comments: [
        {
          author: "Coach",
          text: "Morning prep note",
          timestamp: "2025-03-15T08:00:00Z",
        },
        {
          author: "Athlete",
          text: "Afternoon feedback",
          timestamp: "2025-03-15T14:00:00Z",
        },
      ],
      distance: null,
      duration: null,
      prescribedRpe: null,
      rawHash: "abc123",
    },
    krd: null,
    lastProcessingError: null,
    feedback: null,
    aiMeta: null,
    garminPushId: null,
    tags: [],
    previousState: null,
    createdAt: now,
    modifiedAt: null,
    updatedAt: now,
    ...overrides,
  };
}

describe("RawWorkoutDialog", () => {
  const defaultProps = {
    onClose: vi.fn(),
    onProcess: vi.fn(),
    onSkip: vi.fn(),
    onUnskip: vi.fn(),
  };

  it("should not render content when workout is null", () => {
    // Arrange

    // Act

    renderWithRouter(<RawWorkoutDialog {...defaultProps} workout={null} />);

    // Assert

    expect(screen.queryByTestId("raw-workout-dialog")).not.toBeInTheDocument();
  });

  it("should render dialog content when workout is provided", () => {
    // Arrange

    // Act

    renderWithRouter(
      <RawWorkoutDialog {...defaultProps} workout={makeWorkout()} />
    );

    // Assert

    expect(screen.getByTestId("raw-workout-dialog")).toBeInTheDocument();
  });

  it("should display the workout title", () => {
    // Arrange

    // Act

    renderWithRouter(
      <RawWorkoutDialog {...defaultProps} workout={makeWorkout()} />
    );

    // Assert

    expect(screen.getByText("Easy Run")).toBeInTheDocument();
  });

  it("should display the coach description", () => {
    // Arrange

    // Act

    renderWithRouter(
      <RawWorkoutDialog {...defaultProps} workout={makeWorkout()} />
    );

    // Assert

    expect(
      screen.getByText("Coach says: take it easy today.")
    ).toBeInTheDocument();
  });

  it("should display comments with checkboxes", () => {
    // Arrange

    renderWithRouter(
      <RawWorkoutDialog {...defaultProps} workout={makeWorkout()} />
    );

    const selector = screen.getByTestId("comment-selector");

    // Act

    const checkboxes = within(selector).getAllByRole("checkbox");

    // Assert

    expect(checkboxes).toHaveLength(2);
    expect(screen.getByText("Morning prep note")).toBeInTheDocument();
    expect(screen.getByText("Afternoon feedback")).toBeInTheDocument();
  });

  it("should pre-select comments before noon", () => {
    // Arrange

    renderWithRouter(
      <RawWorkoutDialog {...defaultProps} workout={makeWorkout()} />
    );

    // Act

    const checkboxes = within(
      screen.getByTestId("comment-selector")
    ).getAllByRole("checkbox");

    // First comment at 08:00 (before noon) should be checked

    // Assert

    expect(checkboxes[0]).toBeChecked();
    // Second comment at 14:00 (after noon) should not be checked
    expect(checkboxes[1]).not.toBeChecked();
  });

  it("should show no comments message when there are none", () => {
    // Arrange

    const workout = makeWorkout({
      raw: {
        title: "Easy Run",
        description: "",
        comments: [],
        distance: null,
        duration: null,
        prescribedRpe: null,
        rawHash: "abc",
      },
    });

    // Act

    renderWithRouter(<RawWorkoutDialog {...defaultProps} workout={workout} />);

    // Assert

    expect(screen.getByText("No comments available.")).toBeInTheDocument();
  });

  it("should call onProcess with workout id and selected comment indices", async () => {
    // Arrange

    const user = userEvent.setup();
    const onProcess = vi.fn();

    renderWithRouter(
      <RawWorkoutDialog
        {...defaultProps}
        onProcess={onProcess}
        workout={makeWorkout()}
      />
    );

    // Act

    await user.click(screen.getByText("Process with AI"));

    // Assert

    expect(onProcess).toHaveBeenCalledWith("w-1", [0]);
  });

  it("should call onSkip with workout id", async () => {
    // Arrange

    const user = userEvent.setup();
    const onSkip = vi.fn();

    renderWithRouter(
      <RawWorkoutDialog
        {...defaultProps}
        onSkip={onSkip}
        workout={makeWorkout()}
      />
    );

    // Act

    await user.click(screen.getByText("Skip"));

    // Assert

    expect(onSkip).toHaveBeenCalledWith("w-1");
  });

  it("should show Un-skip button for skipped workouts", () => {
    // Arrange

    const workout = makeWorkout({ state: "skipped" });

    // Act

    renderWithRouter(<RawWorkoutDialog {...defaultProps} workout={workout} />);

    // Assert

    expect(screen.getByText("Un-skip")).toBeInTheDocument();
    expect(screen.queryByText("Process with AI")).not.toBeInTheDocument();
    expect(screen.queryByText("Skip")).not.toBeInTheDocument();
  });

  it("should call onUnskip when Un-skip is clicked", async () => {
    // Arrange

    const user = userEvent.setup();
    const onUnskip = vi.fn();
    const workout = makeWorkout({ state: "skipped" });

    renderWithRouter(
      <RawWorkoutDialog
        {...defaultProps}
        onUnskip={onUnskip}
        workout={workout}
      />
    );

    // Act

    await user.click(screen.getByText("Un-skip"));

    // Assert

    expect(onUnskip).toHaveBeenCalledWith("w-1");
  });

  it("should toggle comment selection on checkbox click", async () => {
    // Arrange

    const user = userEvent.setup();

    renderWithRouter(
      <RawWorkoutDialog {...defaultProps} workout={makeWorkout()} />
    );

    // Act

    const checkboxes = within(
      screen.getByTestId("comment-selector")
    ).getAllByRole("checkbox");

    // First checkbox starts checked (before noon), uncheck it

    // Assert

    expect(checkboxes[0]).toBeChecked();
    await user.click(checkboxes[0]);
    expect(checkboxes[0]).not.toBeChecked();

    // Second checkbox starts unchecked (after noon), check it
    expect(checkboxes[1]).not.toBeChecked();
    await user.click(checkboxes[1]);
    expect(checkboxes[1]).toBeChecked();
  });

  it("should call onClose when dialog is dismissed", async () => {
    // Arrange

    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithRouter(
      <RawWorkoutDialog
        {...defaultProps}
        onClose={onClose}
        workout={makeWorkout()}
      />
    );

    // Act

    await user.click(screen.getByLabelText("Close"));

    // Assert

    expect(onClose).toHaveBeenCalled();
  });

  it("should disable buttons when isSubmitting is true", () => {
    // Arrange

    // Act

    renderWithRouter(
      <RawWorkoutDialog
        {...defaultProps}
        workout={makeWorkout()}
        isSubmitting={true}
      />
    );

    // Assert

    expect(
      screen.getByText("Process with AI").closest("button")
    ).toBeDisabled();
    expect(screen.getByText("Skip").closest("button")).toBeDisabled();
    expect(screen.getByText("Create workout").closest("button")).toBeDisabled();
  });
});
