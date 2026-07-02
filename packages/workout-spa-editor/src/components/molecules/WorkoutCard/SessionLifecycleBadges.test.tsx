import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SessionLifecycleBadges } from "./SessionLifecycleBadges";

const NONE = {
  fromCoach: false,
  aiAssisted: false,
  pushedToGarmin: false,
  executedAndMatched: false,
};

describe("SessionLifecycleBadges", () => {
  it("should render nothing when no facet is active", () => {
    // Arrange

    // Act
    render(<SessionLifecycleBadges flags={NONE} />);

    // Assert
    expect(
      screen.queryByTestId("session-lifecycle-badges")
    ).not.toBeInTheDocument();
  });

  it("should render a distinct badge for each of the 4 active facets", () => {
    // Arrange
    const flags = {
      fromCoach: true,
      aiAssisted: true,
      pushedToGarmin: true,
      executedAndMatched: true,
    };

    // Act
    render(<SessionLifecycleBadges flags={flags} />);

    // Assert
    expect(screen.getByTestId("lifecycle-badge-fromCoach")).toBeInTheDocument();
    expect(
      screen.getByTestId("lifecycle-badge-aiAssisted")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("lifecycle-badge-pushedToGarmin")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("lifecycle-badge-executedAndMatched")
    ).toBeInTheDocument();
  });

  it("should give each badge an accessible label distinct from the others", () => {
    // Arrange
    const flags = {
      ...NONE,
      fromCoach: true,
      pushedToGarmin: true,
    };

    // Act
    render(<SessionLifecycleBadges flags={flags} />);

    // Assert
    expect(
      screen.getByRole("img", { name: "From coach plan" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Pushed to Garmin" })
    ).toBeInTheDocument();
  });

  it("should render only the active subset when some facets are false", () => {
    // Arrange
    const flags = { ...NONE, aiAssisted: true };

    // Act
    render(<SessionLifecycleBadges flags={flags} />);

    // Assert
    expect(
      screen.getByTestId("lifecycle-badge-aiAssisted")
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("lifecycle-badge-fromCoach")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("lifecycle-badge-pushedToGarmin")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("lifecycle-badge-executedAndMatched")
    ).not.toBeInTheDocument();
  });
});
