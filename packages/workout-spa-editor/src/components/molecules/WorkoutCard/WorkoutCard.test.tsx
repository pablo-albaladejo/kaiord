import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  structuredKrd,
  THRESHOLD_STEPS,
} from "../../../test-utils/zone-profile-fixtures";
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
    expect(screen.getByText("Running")).toBeInTheDocument();
  });

  it("should say the lifecycle in a word, not a coloured glyph", () => {
    // Arrange

    const workout = makeWorkout({ state: "pushed" });

    render(<WorkoutCard workout={workout} onClick={vi.fn()} />);

    // Act

    const chip = screen.getByTestId("state-indicator");

    // Assert

    expect(chip).toHaveTextContent("Pushed");
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

    expect(screen.getByText("· Train2Go")).toBeInTheDocument();
  });

  it("should title a structured workout by the name in its KRD", () => {
    // Arrange
    const workout = makeWorkout({
      state: "structured",
      raw: null,
      krd: structuredKrd(THRESHOLD_STEPS),
    });

    // Act
    render(<WorkoutCard workout={workout} onClick={vi.fn()} />);

    // Assert
    expect(screen.getByText("Fixture")).toBeInTheDocument();
  });

  it("should fall back to the sport's name when nothing names the workout", () => {
    // Arrange
    const workout = makeWorkout({ raw: null, krd: null });

    // Act
    render(<WorkoutCard workout={workout} onClick={vi.fn()} />);

    // Assert
    expect(
      screen.getByRole("button", { name: /^Running, Running, Raw$/ })
    ).toBeInTheDocument();
  });

  it("should name a workout made in Kaiord in words, not by its source id", () => {
    // Arrange
    const workout = makeWorkout({ source: "scratch" });

    // Act
    render(<WorkoutCard workout={workout} onClick={vi.fn()} />);

    // Assert
    expect(screen.getByText("· Kaiord")).toBeInTheDocument();
    expect(screen.queryByText(/scratch/)).not.toBeInTheDocument();
  });

  it("should take the duration from the KRD when the raw import has none", () => {
    // Arrange
    const workout = makeWorkout({
      state: "structured",
      raw: null,
      krd: structuredKrd([
        { percentFtp: 60, seconds: 600 },
        { percentFtp: 90, seconds: 600 },
      ]),
    });

    // Act
    render(<WorkoutCard workout={workout} onClick={vi.fn()} />);

    // Assert
    expect(screen.getByText("20m")).toBeInTheDocument();
  });

  it("should leave a session with no structure on the neutral edge", () => {
    // Arrange

    const workout = makeWorkout({ state: "pushed", krd: null });

    render(<WorkoutCard workout={workout} onClick={vi.fn()} />);

    // Act

    const button = screen.getByTestId("workout-card-w1");

    // Assert

    expect(button.className).toContain("border-l-4");
    expect(button.className).toContain("border-l-edge");
  });

  it("should take the lateral border from the session's dominant zone", () => {
    // Arrange

    const workout = makeWorkout({
      state: "ready",
      krd: structuredKrd(THRESHOLD_STEPS),
    });

    render(<WorkoutCard workout={workout} onClick={vi.fn()} />);

    // Act

    const button = screen.getByTestId("workout-card-w1");

    // Assert

    expect(button.className).toContain("border-l-zone-4");
  });

  it("should draw the zone profile only when the session has one", () => {
    // Arrange

    const structured = makeWorkout({ krd: structuredKrd(THRESHOLD_STEPS) });

    // Act

    const { rerender } = render(
      <WorkoutCard workout={structured} onClick={vi.fn()} />
    );
    const withProfile = screen.queryByTestId("zone-profile-bar");
    rerender(<WorkoutCard workout={makeWorkout()} onClick={vi.fn()} />);

    // Assert

    expect(withProfile).not.toBeNull();
    expect(screen.queryByTestId("zone-profile-bar")).not.toBeInTheDocument();
  });

  it("should name the lifecycle in the card's accessible label", () => {
    // Arrange

    const workout = makeWorkout({ state: "raw" });

    // Act

    render(<WorkoutCard workout={workout} onClick={vi.fn()} />);

    // Assert

    expect(
      screen.getByRole("button", { name: /Easy run, Running, Raw/ })
    ).toBeInTheDocument();
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
