/**
 * CardBadges tests.
 *
 * Renders 1–3 badges describing a workout card: sport (always),
 * difficulty (optional), duration (optional, formatted via
 * formatDuration). The component is purely presentational; the
 * branches under test are the conditional renders for difficulty +
 * duration and the difficulty-color helper coupling.
 */

import { describe, expect, it } from "vitest";

import { render, screen } from "../../../../test-utils";
import { CardBadges } from "./CardBadges";

describe("CardBadges", () => {
  it("should render only the sport badge when difficulty and duration are absent", () => {
    // Arrange

    // Act
    render(<CardBadges sport="cycling" />);

    // Assert
    expect(screen.getByText("cycling")).toBeInTheDocument();
    expect(
      screen.queryByText(/^easy$|^medium$|^hard$/)
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/m$/)).not.toBeInTheDocument();
  });

  it("should render the difficulty badge with the matching color class", () => {
    // Arrange

    // Act
    render(<CardBadges sport="running" difficulty="medium" />);

    // Assert
    const badge = screen.getByText("medium");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("bg-yellow-100");
  });

  it("should render the duration badge formatted in minutes only when under one hour", () => {
    // Arrange

    // Act
    render(<CardBadges sport="cycling" duration={1800} />);

    // Assert
    expect(screen.getByText("30m")).toBeInTheDocument();
  });

  it("should render the duration badge formatted with hours and minutes when over one hour", () => {
    // Arrange

    // Act
    render(<CardBadges sport="cycling" duration={5400} />);

    // Assert
    expect(screen.getByText("1h 30m")).toBeInTheDocument();
  });

  it("should not render the duration badge when duration is zero", () => {
    // Arrange

    // Act
    render(<CardBadges sport="cycling" duration={0} />);

    // Assert
    expect(screen.queryByText(/m$/)).not.toBeInTheDocument();
  });

  it("should render all three badges when sport, difficulty, and duration are provided", () => {
    // Arrange

    // Act
    render(<CardBadges sport="swimming" difficulty="hard" duration={2700} />);

    // Assert
    expect(screen.getByText("swimming")).toBeInTheDocument();
    expect(screen.getByText("hard")).toBeInTheDocument();
    expect(screen.getByText("45m")).toBeInTheDocument();
  });
});
