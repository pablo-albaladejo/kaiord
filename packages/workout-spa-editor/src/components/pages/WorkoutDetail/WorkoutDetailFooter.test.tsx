import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { WorkoutRecord } from "../../../types/calendar-record";
import type { TrainingPeaksGate } from "../../organisms/EditorStateRibbon/use-trainingpeaks-gate";
import { WorkoutDetailFooter } from "./WorkoutDetailFooter";

let mockGate: TrainingPeaksGate = "no-extension";
let mockHint: string | null = null;

vi.mock("wouter", () => ({
  useLocation: () => ["/workout/view/w1", vi.fn()],
}));

vi.mock("../../organisms/EditorStateRibbon/use-trainingpeaks-gate", () => ({
  useTrainingPeaksGate: () => mockGate,
}));

// The real send control: a button and, while it cannot send, the reason
// beneath it — the shape whose height used to stretch the footer row.
vi.mock("../../molecules/PushButton", () => ({
  PushButton: () => (
    <div>
      <button type="button">Send to Garmin</button>
      {mockHint && <p>{mockHint}</p>}
    </div>
  ),
}));

vi.mock(
  "../../molecules/TrainingPeaksPushButton/TrainingPeaksPushButton",
  () => ({
    TrainingPeaksPushButton: () => (
      <button type="button">Send to TrainingPeaks</button>
    ),
  })
);

const WORKOUT = {
  id: "w1",
  profileId: "p1",
  sport: "cycling",
  tags: [],
} as unknown as WorkoutRecord;

const columnOf = (name: string) =>
  screen.getByRole("button", { name }).closest(".flex-1");

describe("WorkoutDetailFooter", () => {
  beforeEach(() => {
    mockGate = "no-extension";
    mockHint = null;
  });

  it("should keep Edit and Adjust with AI at their own height beside the send hint", () => {
    // Arrange
    // A flex row stretches its items by default, so the hint under the
    // Garmin button made both neighbours as tall as button plus hint.
    mockHint = "Sign in to Garmin Connect in this browser to send it.";

    // Act
    render(<WorkoutDetailFooter workout={WORKOUT} onEdit={vi.fn()} />);
    const footer = screen.getByTestId("workout-detail-footer");

    // Assert
    expect(screen.getByText(mockHint)).toBeInTheDocument();
    expect(footer).toHaveClass("flex-wrap", "items-start");
    expect(footer).not.toHaveClass("sticky");
  });

  it("should give the Garmin control a minimum width so it wraps on a phone", () => {
    // Arrange

    // Act
    render(<WorkoutDetailFooter workout={WORKOUT} onEdit={vi.fn()} />);

    // Assert
    expect(columnOf("Send to Garmin")).toHaveClass("min-w-48");
    expect(
      screen.queryByRole("button", { name: "Send to TrainingPeaks" })
    ).not.toBeInTheDocument();
  });

  it("should give the TrainingPeaks control its own wrapping column once ready", () => {
    // Arrange
    // Reachable state: the extension is discovered and the profile has an
    // enabled workout export route to TrainingPeaks.
    mockGate = "ready";

    // Act
    render(<WorkoutDetailFooter workout={WORKOUT} onEdit={vi.fn()} />);
    const column = columnOf("Send to TrainingPeaks");

    // Assert
    expect(column).toHaveClass("min-w-48");
    expect(column).not.toBe(columnOf("Send to Garmin"));
  });
});
