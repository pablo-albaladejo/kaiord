import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { WorkoutRecord } from "../../../types/calendar-record";
import { WorkoutCard } from "./WorkoutCard";

function makeWorkout(overrides: Partial<WorkoutRecord> = {}): WorkoutRecord {
  return {
    id: "w1",
    date: "2026-04-06",
    sport: "running",
    source: "kaiord",
    sourceId: null,
    planId: null,
    state: "raw",
    raw: {
      title: "Easy run",
      description: "30 min easy",
      comments: [],
      distance: null,
      duration: { value: 1800, unit: "s" },
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
    createdAt: "2026-04-06T08:00:00.000Z",
    modifiedAt: null,
    updatedAt: "2026-04-06T08:00:00.000Z",
    ...overrides,
  };
}

describe("WorkoutCard", () => {
  it("should render title and sport", () => {
    // Arrange

    const workout = makeWorkout();

    // Act

    render(<WorkoutCard workout={workout} onClick={vi.fn()} />);

    // Assert

    expect(screen.getByText("Easy run")).toBeInTheDocument();
    expect(screen.getByText("running")).toBeInTheDocument();
  });

  it("should show state indicator", () => {
    // Arrange

    const workout = makeWorkout({ state: "pushed" });

    render(<WorkoutCard workout={workout} onClick={vi.fn()} />);

    // Act

    const indicator = screen.getByTestId("state-indicator");

    // Assert

    expect(indicator).toHaveTextContent("\u2713");
  });

  it("should call onClick when clicked", async () => {
    // Arrange

    const user = userEvent.setup();
    const onClick = vi.fn();
    const workout = makeWorkout();

    render(<WorkoutCard workout={workout} onClick={onClick} />);

    // Act

    await user.click(screen.getByTestId("workout-card-w1"));

    // Assert

    expect(onClick).toHaveBeenCalledWith(workout);
  });

  it("should show duration when present", () => {
    // Arrange

    const workout = makeWorkout();

    // Act

    render(<WorkoutCard workout={workout} onClick={vi.fn()} />);

    // Assert

    expect(screen.getByText("30m")).toBeInTheDocument();
  });

  it("should show source as a muted origin chip (no coloured badge)", () => {
    // Arrange

    const workout = makeWorkout({ source: "train2go" });

    // Act

    render(<WorkoutCard workout={workout} onClick={vi.fn()} />);

    // Assert

    expect(screen.getByText("· train2go")).toBeInTheDocument();
  });

  it("should use the lateral border colour driven by state", () => {
    // Arrange

    const workout = makeWorkout({ state: "pushed" });

    render(<WorkoutCard workout={workout} onClick={vi.fn()} />);

    // Act

    const button = screen.getByTestId("workout-card-w1");

    // Assert

    expect(button.className).toContain("border-l-4");
    expect(button.className).toContain("border-emerald-600");
  });

  it("should give the state indicator an accessible label", () => {
    // Arrange

    const workout = makeWorkout({ state: "raw" });

    // Act

    render(<WorkoutCard workout={workout} onClick={vi.fn()} />);

    // Assert

    expect(screen.getByRole("img", { name: "Raw" })).toBeInTheDocument();
  });

  it("should not show any lifecycle badge for a plain manual workout", () => {
    // Arrange

    const workout = makeWorkout();

    // Act

    render(<WorkoutCard workout={workout} onClick={vi.fn()} />);

    // Assert

    expect(
      screen.queryByTestId("session-lifecycle-badges")
    ).not.toBeInTheDocument();
  });

  it("should show the fromCoach and pushedToGarmin lifecycle badges when applicable", () => {
    // Arrange

    const workout = makeWorkout({
      source: "train2go",
      garminPushId: "garmin-1",
    });

    // Act

    render(<WorkoutCard workout={workout} onClick={vi.fn()} />);

    // Assert

    expect(screen.getByTestId("lifecycle-badge-fromCoach")).toBeInTheDocument();
    expect(
      screen.getByTestId("lifecycle-badge-pushedToGarmin")
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("lifecycle-badge-aiAssisted")
    ).not.toBeInTheDocument();
  });

  it("should show the aiAssisted lifecycle badge for an AI-generated workout", () => {
    // Arrange

    const workout = makeWorkout({ source: "ai-generated" });

    // Act

    render(<WorkoutCard workout={workout} onClick={vi.fn()} />);

    // Assert

    expect(
      screen.getByTestId("lifecycle-badge-aiAssisted")
    ).toBeInTheDocument();
  });
});
