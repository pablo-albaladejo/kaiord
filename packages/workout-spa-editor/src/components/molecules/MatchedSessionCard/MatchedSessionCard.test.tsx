import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingActivity } from "../../../types/coaching-activity";
import { type MatchedSession, MatchedSessionCard } from "./MatchedSessionCard";

const baseActivity: CoachingActivity = {
  id: "train2go:123",
  source: "train2go",
  sourceBadge: "T2G",
  date: "2026-04-29",
  sport: { label: "Cycling", icon: "\u{1F6B4}" },
  title: "FTP test",
  duration: "60 min",
  effort: 4,
  status: "completed",
};

const baseWorkout: WorkoutRecord = {
  id: "w-abc",
  date: "2026-04-29",
  state: "ready",
  source: "train2go",
  sourceId: null,
  planId: null,
  sport: "cycling",
  raw: {
    title: "FTP test executed",
    description: "",
    comments: [],
    distance: null,
    duration: { value: 3600, unit: "s" },
    prescribedRpe: null,
    rawHash: "h",
  },
  krd: null,
  lastProcessingError: null,
  feedback: null,
  aiMeta: null,
  garminPushId: null,
  tags: [],
  previousState: null,
  createdAt: "2026-04-29T10:00:00.000Z",
  modifiedAt: null,
  updatedAt: "2026-04-29T10:00:00.000Z",
};

const session = (overrides: Partial<MatchedSession> = {}): MatchedSession => ({
  activity: baseActivity,
  workout: baseWorkout,
  complianceScore: 0.95,
  ...overrides,
});

describe("MatchedSessionCard", () => {
  it("should render the actual workout title in compact mode", () => {
    // Arrange

    // Act

    render(<MatchedSessionCard session={session()} density="compact" />);

    // Assert

    expect(screen.getByText("FTP test executed")).toBeInTheDocument();
    // Plan title is NOT visible in compact mode
    expect(screen.queryByText("FTP test")).not.toBeInTheDocument();
  });

  it("should preserve the planned title in tooltip and aria-label in compact mode", () => {
    // Arrange

    render(<MatchedSessionCard session={session()} density="compact" />);

    // Act

    const button = screen.getByTestId("matched-card-train2go:123");

    // Assert

    expect(button.getAttribute("aria-label")).toContain("planned: FTP test");
    expect(button.getAttribute("title")).toContain("(1h 0m / 60 min)");
  });

  it("should render plan AND actual rows with their labels in comfortable mode", () => {
    // Arrange

    // Act

    render(<MatchedSessionCard session={session()} density="comfortable" />);

    // Assert

    expect(screen.getByText("Plan ·")).toBeInTheDocument();
    expect(screen.getByText("Actual ·")).toBeInTheDocument();
    expect(screen.getByText("60 min")).toBeInTheDocument();
    expect(screen.getByText("1h 0m")).toBeInTheDocument();
  });

  it("should render the visible compliance percentage in comfortable mode", () => {
    // Arrange

    // Act

    render(<MatchedSessionCard session={session()} density="comfortable" />);

    // Assert

    expect(screen.getByText("95%")).toBeInTheDocument();
  });

  it("should use emerald lateral border for high-compliance sessions", () => {
    // Arrange

    render(<MatchedSessionCard session={session({ complianceScore: 0.95 })} />);

    // Act

    const button = screen.getByTestId("matched-card-train2go:123");

    // Assert

    expect(button.className).toContain("border-emerald-600");
  });

  it("should use amber lateral border for low-compliance sessions", () => {
    // Arrange

    render(<MatchedSessionCard session={session({ complianceScore: 0.3 })} />);

    // Act

    const button = screen.getByTestId("matched-card-train2go:123");

    // Assert

    expect(button.className).toContain("border-amber-600");
  });

  it("should use neutral slate-500 lateral border when complianceScore is null", () => {
    // Arrange

    render(<MatchedSessionCard session={session({ complianceScore: null })} />);

    // Act

    const button = screen.getByTestId("matched-card-train2go:123");

    // Assert

    expect(button.className).toContain("border-slate-500");
    expect(button.getAttribute("aria-label")).toContain(
      "compliance unavailable"
    );
  });

  it("should include the compliance percentage in the aria-label", () => {
    // Arrange

    // Act

    render(<MatchedSessionCard session={session({ complianceScore: 0.92 })} />);

    // Assert

    expect(screen.getByLabelText(/Matched session.*92%/i)).toBeInTheDocument();
  });

  it("should NOT render the executed slot when no executeds are present", () => {
    // Arrange

    // Act
    render(<MatchedSessionCard session={session()} />);

    // Assert
    expect(
      screen.queryByTestId("matched-card-executed-group")
    ).not.toBeInTheDocument();
  });

  it("should render the executed slot with one row when a single executed is present", () => {
    // Arrange
    const executed: WorkoutRecord = {
      ...baseWorkout,
      id: "w-exec-1",
      source: "garmin",
      raw: { ...baseWorkout.raw!, title: "Garmin recorded ride" },
    };

    // Act
    render(<MatchedSessionCard session={session({ executed: [executed] })} />);

    // Assert
    expect(
      screen.getByTestId("matched-card-executed-group")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("matched-card-executed-w-exec-1")
    ).toBeInTheDocument();
    expect(screen.getByText("Garmin recorded ride")).toBeInTheDocument();
    expect(
      screen.queryByTestId("matched-card-executed-count")
    ).not.toBeInTheDocument();
  });

  it("should render a count badge when more than one executed is present (1-N)", () => {
    // Arrange
    const e1: WorkoutRecord = { ...baseWorkout, id: "w-exec-1" };
    const e2: WorkoutRecord = { ...baseWorkout, id: "w-exec-2" };

    // Act
    render(<MatchedSessionCard session={session({ executed: [e1, e2] })} />);

    // Assert
    expect(screen.getByTestId("matched-card-executed-count")).toHaveTextContent(
      "2"
    );
    expect(
      screen.getByTestId("matched-card-executed-w-exec-1")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("matched-card-executed-w-exec-2")
    ).toBeInTheDocument();
  });

  it("should call onClick with the activity when clicked", async () => {
    // Arrange

    const onClick = vi.fn();

    render(<MatchedSessionCard session={session()} onClick={onClick} />);

    // Act

    await userEvent.click(screen.getByTestId("matched-card-train2go:123"));

    // Assert

    expect(onClick).toHaveBeenCalledWith(baseActivity);
  });
});
