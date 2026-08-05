import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ProposalMetric } from "./SessionProposalCard";
import { SessionProposalCard } from "./SessionProposalCard";

/* Weights, not fractions: the card only asks which zone is largest. */
const DIST = [1, 2, 1, 100, 1];

describe("SessionProposalCard", () => {
  it("should keep the label and add the comparison beneath it", () => {
    // Arrange
    const metrics: ProposalMetric[] = [
      {
        value: "52 min",
        comparison: "already there: 45 min",
        label: "Duration",
      },
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
    expect(screen.getByText("already there: 45 min")).toBeInTheDocument();
    // The label carries the unit; folding it away made "78 / was 40 TSS" read
    // as one session whose load changed.
    expect(screen.getByText("Duration")).toBeInTheDocument();
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
    expect(screen.queryByText(/already there/)).not.toBeInTheDocument();
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
