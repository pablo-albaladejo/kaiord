import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ProposalMetric } from "./SessionProposalCard";
import { SessionProposalCard } from "./SessionProposalCard";

/* Weights, not fractions: the card only asks which zone is largest. */
const DIST = [1, 2, 1, 100, 1];

describe("SessionProposalCard", () => {
  it("should render the before value in place of the label when one exists", () => {
    // Arrange
    const metrics: ProposalMetric[] = [
      { value: "52 min", was: "was 1 h 15 m", label: "Duration" },
    ];

    // Act
    render(
      <SessionProposalCard
        title="Threshold 1 × 15"
        metrics={metrics}
        dist={DIST}
      />
    );

    // Assert
    expect(screen.getByText("52 min")).toBeInTheDocument();
    expect(screen.getByText("was 1 h 15 m")).toBeInTheDocument();
    expect(screen.queryByText("Duration")).not.toBeInTheDocument();
  });

  it("should render the label alone when there is nothing to compare against", () => {
    // Arrange
    const metrics: ProposalMetric[] = [{ value: "52 min", label: "Duration" }];

    // Act
    render(
      <SessionProposalCard
        title="Threshold 1 × 15"
        metrics={metrics}
        dist={DIST}
      />
    );

    // Assert
    expect(screen.getByText("Duration")).toBeInTheDocument();
    expect(screen.queryByText(/was /)).not.toBeInTheDocument();
  });

  it("should carry a lateral border in the dominant zone", () => {
    // Arrange
    const metrics: ProposalMetric[] = [{ value: "52 min", label: "Duration" }];

    // Act
    render(
      <SessionProposalCard
        title="Threshold 1 × 15"
        metrics={metrics}
        dist={DIST}
      />
    );

    // Assert
    expect(
      screen.getByTestId("session-proposal").getAttribute("style")
    ).toContain("border-left: 4px solid var(--zone-4)");
  });

  it("should render no zone border for an unclassifiable session", () => {
    // Arrange
    const metrics: ProposalMetric[] = [{ value: "52 min", label: "Duration" }];

    // Act
    render(
      <SessionProposalCard
        title="Threshold 1 × 15"
        metrics={metrics}
        dist={[0, 0, 0, 0, 0]}
      />
    );

    // Assert
    expect(screen.getByTestId("session-proposal").style.borderLeft).toBe("");
  });
});
