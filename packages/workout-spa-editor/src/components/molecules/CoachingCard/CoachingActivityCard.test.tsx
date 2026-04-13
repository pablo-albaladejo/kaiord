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

  it("renders effort dots", () => {
    render(<CoachingActivityCard activity={baseActivity} />);
    expect(screen.getByTitle("Effort: 3/5")).toBeInTheDocument();
  });

  it("renders status", () => {
    render(<CoachingActivityCard activity={baseActivity} />);
    expect(screen.getByText("pending")).toBeInTheDocument();
  });

  it("expands description on click", async () => {
    const activity = { ...baseActivity, description: "Warmup: 10 min Z1" };
    render(<CoachingActivityCard activity={activity} />);

    expect(screen.queryByText("Warmup: 10 min Z1")).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId("coaching-card-train2go:123"));

    expect(screen.getByText("Warmup: 10 min Z1")).toBeInTheDocument();
  });

  it("calls onExpand on first click", async () => {
    const onExpand = vi.fn();
    render(
      <CoachingActivityCard activity={baseActivity} onExpand={onExpand} />
    );

    await userEvent.click(screen.getByTestId("coaching-card-train2go:123"));

    expect(onExpand).toHaveBeenCalledWith(baseActivity);
  });

  it("does not call onExpand on collapse click", async () => {
    const onExpand = vi.fn();
    const activity = { ...baseActivity, description: "Some text" };
    render(<CoachingActivityCard activity={activity} onExpand={onExpand} />);

    const card = screen.getByTestId("coaching-card-train2go:123");
    await userEvent.click(card); // expand
    await userEvent.click(card); // collapse

    expect(onExpand).toHaveBeenCalledTimes(1);
  });

  it("is not editable (no edit controls)", () => {
    render(<CoachingActivityCard activity={baseActivity} />);

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });
});
