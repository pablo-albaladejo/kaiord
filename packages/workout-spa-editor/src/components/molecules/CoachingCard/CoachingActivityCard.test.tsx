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
  it("should render title and the origin chip (sport label is icon-only)", () => {
    // Arrange

    // Act

    render(<CoachingActivityCard activity={baseActivity} />);

    // Assert

    expect(screen.getByText("Intervals")).toBeInTheDocument();
    // Sport label is conveyed by aria-label on the icon, not duplicated as text.
    expect(screen.getByRole("img", { name: "Cycling" })).toBeInTheDocument();
    expect(screen.queryByText("Cycling")).not.toBeInTheDocument();
    expect(screen.getByText("· T2G")).toBeInTheDocument();
  });

  it("should render duration", () => {
    // Arrange

    // Act

    render(<CoachingActivityCard activity={baseActivity} />);

    // Assert

    expect(screen.getByText("1:30 h")).toBeInTheDocument();
  });

  it("should render intensity dots with an accessible name", () => {
    // Arrange

    // Act

    render(<CoachingActivityCard activity={baseActivity} />);

    // Assert

    expect(screen.getByLabelText("Intensity 3 of 5")).toBeInTheDocument();
  });

  it.each([
    "pending",
    "completed",
    "skipped",
  ] satisfies CoachingActivity["status"][])(
    "should keep the lateral border neutral for a %s plan with no structure",
    (status) => {
      // Arrange
      render(<CoachingActivityCard activity={{ ...baseActivity, status }} />);

      // Act
      const button = screen.getByTestId("coaching-card-train2go:123");

      // Assert
      expect(button.className).toContain("border-l-4");
      expect(button.className).toContain("border-l-edge");
    }
  );

  it("should never draw a zone bar from an effort rating", () => {
    // Arrange

    // Act

    render(<CoachingActivityCard activity={baseActivity} />);

    // Assert

    expect(screen.queryByTestId("zone-profile-bar")).not.toBeInTheDocument();
  });

  it("should say the status in a word", () => {
    // Arrange

    // Act

    render(<CoachingActivityCard activity={baseActivity} />);

    // Assert

    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("should call onClick with the activity (no inline expand)", async () => {
    // Arrange

    const onClick = vi.fn();
    render(<CoachingActivityCard activity={baseActivity} onClick={onClick} />);

    // Act

    await userEvent.click(screen.getByTestId("coaching-card-train2go:123"));

    // Assert

    expect(onClick).toHaveBeenCalledWith(baseActivity);
  });

  it("should do NOT inline-expand description (dialog handles it now)", async () => {
    // Arrange

    const activity = { ...baseActivity, description: "Warmup: 10 min Z1" };
    render(<CoachingActivityCard activity={activity} />);

    // Act

    await userEvent.click(screen.getByTestId("coaching-card-train2go:123"));

    // Assert

    expect(screen.queryByText("Warmup: 10 min Z1")).not.toBeInTheDocument();
  });

  it("should be not editable (no edit controls)", () => {
    // Arrange

    // Act

    render(<CoachingActivityCard activity={baseActivity} />);

    // Assert

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });

  it("should show the fromCoach lifecycle badge for a train2go activity", () => {
    // Arrange

    // Act

    render(<CoachingActivityCard activity={baseActivity} />);

    // Assert

    expect(screen.getByTestId("lifecycle-badge-fromCoach")).toBeInTheDocument();
    expect(
      screen.queryByTestId("lifecycle-badge-aiAssisted")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("lifecycle-badge-pushedToGarmin")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("lifecycle-badge-executedAndMatched")
    ).not.toBeInTheDocument();
  });
});
