import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { CoachingActivity } from "../../../types/coaching-activity";
import { CoachingActivityCard } from "./CoachingActivityCard";

const baseActivity: CoachingActivity = {
  id: "train2go:123",
  source: "train2go",
  sourceBadge: "T2G",
  date: "2026-04-13",
  sport: { label: "Cycling", icon: "\u{1F6B4}" },
  title: "Intervals",
  duration: "1:30 h",
  effort: 3,
  status: "pending",
};

describe("CoachingActivityCard", () => {
  it("renders title and sport", () => {
    render(<CoachingActivityCard activity={baseActivity} />);

    expect(screen.getByText("Intervals")).toBeInTheDocument();
    expect(screen.getByText("Cycling")).toBeInTheDocument();
    expect(screen.getByText("T2G")).toBeInTheDocument();
  });

  it("renders duration", () => {
    render(<CoachingActivityCard activity={baseActivity} />);
    expect(screen.getByText("1:30 h")).toBeInTheDocument();
  });

  it("renders intensity dots", () => {
    render(<CoachingActivityCard activity={baseActivity} />);
    expect(screen.getByTitle("Intensity: 3/5")).toBeInTheDocument();
  });

  it("renders status", () => {
    render(<CoachingActivityCard activity={baseActivity} />);
    expect(screen.getByText("pending")).toBeInTheDocument();
  });

  it("calls onClick with the activity (no inline expand)", async () => {
    const onClick = vi.fn();
    render(<CoachingActivityCard activity={baseActivity} onClick={onClick} />);

    await userEvent.click(screen.getByTestId("coaching-card-train2go:123"));

    expect(onClick).toHaveBeenCalledWith(baseActivity);
  });

  it("does NOT inline-expand description (dialog handles it now)", async () => {
    const activity = { ...baseActivity, description: "Warmup: 10 min Z1" };
    render(<CoachingActivityCard activity={activity} />);

    await userEvent.click(screen.getByTestId("coaching-card-train2go:123"));

    expect(screen.queryByText("Warmup: 10 min Z1")).not.toBeInTheDocument();
  });

  it("is not editable (no edit controls)", () => {
    render(<CoachingActivityCard activity={baseActivity} />);

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });
});
