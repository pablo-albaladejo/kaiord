import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { MatchSuggestion } from "../../../application/match-suggestion";
import { AutoMatchBanner } from "./AutoMatchBanner";

const sug = (overrides: Partial<MatchSuggestion> = {}): MatchSuggestion => ({
  activityId: "p1:train2go:1",
  workoutId: "w-1",
  score: 0.92,
  reasons: [{ code: "sport-family-match", family: "cycling" }],
  ...overrides,
});

describe("AutoMatchBanner", () => {
  it("should render nothing when there are no suggestions", () => {
    render(
      <AutoMatchBanner suggestions={[]} onAccept={vi.fn()} onReject={vi.fn()} />
    );

    expect(screen.queryByTestId("auto-match-banner")).not.toBeInTheDocument();
  });

  it("should render one row per suggestion (capped at 2 in collapsed state)", () => {
    render(
      <AutoMatchBanner
        suggestions={[
          sug({ activityId: "a1", workoutId: "w1" }),
          sug({ activityId: "a2", workoutId: "w2", score: 0.8 }),
          sug({ activityId: "a3", workoutId: "w3", score: 0.7 }),
        ]}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />
    );

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText(/view all/i)).toBeInTheDocument();
  });

  it("expands to show all rows when 'view all' is clicked", async () => {
    render(
      <AutoMatchBanner
        suggestions={[
          sug({ activityId: "a1", workoutId: "w1" }),
          sug({ activityId: "a2", workoutId: "w2" }),
          sug({ activityId: "a3", workoutId: "w3" }),
        ]}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />
    );

    await userEvent.click(screen.getByText(/view all/i));

    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByText("Collapse")).toBeInTheDocument();
  });

  it("should call onAccept and announces remaining count when Accept is clicked", async () => {
    const onAccept = vi.fn();
    render(
      <AutoMatchBanner
        suggestions={[sug(), sug({ activityId: "a2", workoutId: "w2" })]}
        onAccept={onAccept}
        onReject={vi.fn()}
      />
    );

    await userEvent.click(
      screen.getAllByRole("button", { name: /accept/i })[0]!
    );

    expect(onAccept).toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Session matched. 1 suggestions remaining."
    );
  });

  it("should call onReject and announces remaining count when Reject is clicked", async () => {
    const onReject = vi.fn();
    render(
      <AutoMatchBanner
        suggestions={[sug(), sug({ activityId: "a2", workoutId: "w2" })]}
        onAccept={vi.fn()}
        onReject={onReject}
      />
    );

    await userEvent.click(
      screen.getAllByRole("button", { name: /reject/i })[0]!
    );

    expect(onReject).toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Suggestion dismissed. 1 suggestions remaining."
    );
  });

  it("does NOT render a 'Dismiss all' control (per-pair dismissal model)", () => {
    render(
      <AutoMatchBanner
        suggestions={[sug()]}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />
    );

    expect(screen.queryByText("Dismiss all")).not.toBeInTheDocument();
  });

  it("should use the resolveActivity / resolveWorkoutTitle helpers for friendly labels", () => {
    render(
      <AutoMatchBanner
        suggestions={[sug({ activityId: "a1", workoutId: "w1" })]}
        onAccept={vi.fn()}
        onReject={vi.fn()}
        resolveActivity={(id) => ({
          id,
          source: "train2go",
          sourceBadge: "T2G",
          date: "2026-04-29",
          sport: { label: "Cycling", icon: "\u{1F6B4}" },
          title: "FTP test plan",
          status: "pending",
        })}
        resolveWorkoutTitle={() => "FTP test executed"}
      />
    );

    expect(screen.getByText("FTP test plan")).toBeInTheDocument();
    expect(screen.getByText(/FTP test executed/)).toBeInTheDocument();
  });

  it("should be a region landmark with an accessible label", () => {
    render(
      <AutoMatchBanner
        suggestions={[sug()]}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />
    );

    expect(
      screen.getByRole("region", { name: /auto-match suggestions/i })
    ).toBeInTheDocument();
  });
});
