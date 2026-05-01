import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { CoachingActivity } from "../../../types/coaching-activity";
import type { WorkoutRecord } from "../../../types/calendar-record";
import { MatchedSessionCard, type MatchedSession } from "./MatchedSessionCard";

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
  it("renders the actual workout title in compact mode", () => {
    render(<MatchedSessionCard session={session()} density="compact" />);

    expect(screen.getByText("FTP test executed")).toBeInTheDocument();
    // Plan title is NOT visible in compact mode
    expect(screen.queryByText("FTP test")).not.toBeInTheDocument();
  });

  it("preserves the planned title in tooltip and aria-label in compact mode", () => {
    render(<MatchedSessionCard session={session()} density="compact" />);

    const button = screen.getByTestId("matched-card-train2go:123");
    expect(button.getAttribute("aria-label")).toContain("planned: FTP test");
    expect(button.getAttribute("title")).toContain("(1h 0m / 60 min)");
  });

  it("renders plan AND actual rows with their labels in comfortable mode", () => {
    render(<MatchedSessionCard session={session()} density="comfortable" />);

    expect(screen.getByText("Plan ·")).toBeInTheDocument();
    expect(screen.getByText("Actual ·")).toBeInTheDocument();
    expect(screen.getByText("60 min")).toBeInTheDocument();
    expect(screen.getByText("1h 0m")).toBeInTheDocument();
  });

  it("renders the visible compliance percentage in comfortable mode", () => {
    render(<MatchedSessionCard session={session()} density="comfortable" />);

    expect(screen.getByText("95%")).toBeInTheDocument();
  });

  it("uses emerald lateral border for high-compliance sessions", () => {
    render(<MatchedSessionCard session={session({ complianceScore: 0.95 })} />);

    const button = screen.getByTestId("matched-card-train2go:123");
    expect(button.className).toContain("border-emerald-600");
  });

  it("uses amber lateral border for low-compliance sessions", () => {
    render(<MatchedSessionCard session={session({ complianceScore: 0.3 })} />);

    const button = screen.getByTestId("matched-card-train2go:123");
    expect(button.className).toContain("border-amber-600");
  });

  it("uses neutral slate-500 lateral border when complianceScore is null", () => {
    render(<MatchedSessionCard session={session({ complianceScore: null })} />);

    const button = screen.getByTestId("matched-card-train2go:123");
    expect(button.className).toContain("border-slate-500");
    expect(button.getAttribute("aria-label")).toContain(
      "compliance unavailable"
    );
  });

  it("includes the compliance percentage in the aria-label", () => {
    render(<MatchedSessionCard session={session({ complianceScore: 0.92 })} />);

    expect(screen.getByLabelText(/Matched session.*92%/i)).toBeInTheDocument();
  });

  it("calls onClick with the activity when clicked", async () => {
    const onClick = vi.fn();

    render(<MatchedSessionCard session={session()} onClick={onClick} />);
    await userEvent.click(screen.getByTestId("matched-card-train2go:123"));

    expect(onClick).toHaveBeenCalledWith(baseActivity);
  });
});
