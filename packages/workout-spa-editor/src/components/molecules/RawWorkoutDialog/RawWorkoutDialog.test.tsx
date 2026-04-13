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

  it("does not render content when workout is null", () => {
    renderWithRouter(<RawWorkoutDialog {...defaultProps} workout={null} />);

    expect(screen.queryByTestId("raw-workout-dialog")).not.toBeInTheDocument();
  });

  it("renders dialog content when workout is provided", () => {
    renderWithRouter(
      <RawWorkoutDialog {...defaultProps} workout={makeWorkout()} />
    );

    expect(screen.getByTestId("raw-workout-dialog")).toBeInTheDocument();
  });

  it("displays the workout title", () => {
    renderWithRouter(
      <RawWorkoutDialog {...defaultProps} workout={makeWorkout()} />
    );

    expect(screen.getByText("Easy Run")).toBeInTheDocument();
  });

  it("displays the coach description", () => {
    renderWithRouter(
      <RawWorkoutDialog {...defaultProps} workout={makeWorkout()} />
    );

    expect(
      screen.getByText("Coach says: take it easy today.")
    ).toBeInTheDocument();
  });

  it("displays comments with checkboxes", () => {
    renderWithRouter(
      <RawWorkoutDialog {...defaultProps} workout={makeWorkout()} />
    );

    const selector = screen.getByTestId("comment-selector");
    const checkboxes = within(selector).getAllByRole("checkbox");

    expect(checkboxes).toHaveLength(2);
    expect(screen.getByText("Morning prep note")).toBeInTheDocument();
    expect(screen.getByText("Afternoon feedback")).toBeInTheDocument();
  });

  it("pre-selects comments before noon", () => {
    renderWithRouter(
      <RawWorkoutDialog {...defaultProps} workout={makeWorkout()} />
    );

    const checkboxes = within(
      screen.getByTestId("comment-selector")
    ).getAllByRole("checkbox");

    // First comment at 08:00 (before noon) should be checked
    expect(checkboxes[0]).toBeChecked();
    // Second comment at 14:00 (after noon) should not be checked
    expect(checkboxes[1]).not.toBeChecked();
  });

  it("shows no comments message when there are none", () => {
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

    renderWithRouter(<RawWorkoutDialog {...defaultProps} workout={workout} />);

    expect(screen.getByText("No comments available.")).toBeInTheDocument();
  });

  it("calls onProcess with workout id and selected comment indices", async () => {
    const user = userEvent.setup();
    const onProcess = vi.fn();

    renderWithRouter(
      <RawWorkoutDialog
        {...defaultProps}
        onProcess={onProcess}
        workout={makeWorkout()}
      />
    );

    await user.click(screen.getByText("Process with AI"));

    expect(onProcess).toHaveBeenCalledWith("w-1", [0]);
  });

  it("calls onSkip with workout id", async () => {
    const user = userEvent.setup();
    const onSkip = vi.fn();

    renderWithRouter(
      <RawWorkoutDialog
        {...defaultProps}
        onSkip={onSkip}
        workout={makeWorkout()}
      />
    );

    await user.click(screen.getByText("Skip"));

    expect(onSkip).toHaveBeenCalledWith("w-1");
  });

  it("shows Un-skip button for skipped workouts", () => {
    const workout = makeWorkout({ state: "skipped" });

    renderWithRouter(<RawWorkoutDialog {...defaultProps} workout={workout} />);

    expect(screen.getByText("Un-skip")).toBeInTheDocument();
    expect(screen.queryByText("Process with AI")).not.toBeInTheDocument();
    expect(screen.queryByText("Skip")).not.toBeInTheDocument();
  });

  it("calls onUnskip when Un-skip is clicked", async () => {
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

    await user.click(screen.getByText("Un-skip"));

    expect(onUnskip).toHaveBeenCalledWith("w-1");
  });

  it("toggles comment selection on checkbox click", async () => {
    const user = userEvent.setup();

    renderWithRouter(
      <RawWorkoutDialog {...defaultProps} workout={makeWorkout()} />
    );

    const checkboxes = within(
      screen.getByTestId("comment-selector")
    ).getAllByRole("checkbox");

    // First checkbox starts checked (before noon), uncheck it
    expect(checkboxes[0]).toBeChecked();
    await user.click(checkboxes[0]);
    expect(checkboxes[0]).not.toBeChecked();

    // Second checkbox starts unchecked (after noon), check it
    expect(checkboxes[1]).not.toBeChecked();
    await user.click(checkboxes[1]);
    expect(checkboxes[1]).toBeChecked();
  });

  it("calls onClose when dialog is dismissed", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithRouter(
      <RawWorkoutDialog
        {...defaultProps}
        onClose={onClose}
        workout={makeWorkout()}
      />
    );

    await user.click(screen.getByLabelText("Close"));

    expect(onClose).toHaveBeenCalled();
  });

  it("disables buttons when isSubmitting is true", () => {
    renderWithRouter(
      <RawWorkoutDialog
        {...defaultProps}
        workout={makeWorkout()}
        isSubmitting={true}
      />
    );

    expect(
      screen.getByText("Process with AI").closest("button")
    ).toBeDisabled();
    expect(screen.getByText("Skip").closest("button")).toBeDisabled();
    expect(
      screen.getByText("Create manually").closest("button")
    ).toBeDisabled();
  });
});
