import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import type { DayWellness } from "../../../../types/health/day-wellness";
import { WellnessBand } from "./WellnessBand";

function renderBand(wellness: DayWellness | undefined) {
  const loc = memoryLocation({ path: "/calendar", record: true });
  return {
    ...render(
      <Router hook={loc.hook}>
        <WellnessBand wellness={wellness} />
      </Router>
    ),
    location: loc,
  };
}

describe("WellnessBand", () => {
  it("should render a badge only for present metrics", () => {
    // Arrange
    const wellness: DayWellness = { sleep: "82", weight: "72.4" };

    // Act
    renderBand(wellness);

    // Assert
    expect(screen.getByTestId("wellness-badge-sleep")).toBeInTheDocument();
    expect(screen.getByTestId("wellness-badge-weight")).toBeInTheDocument();
    expect(screen.queryByTestId("wellness-badge-hrv")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("wellness-badge-steps")
    ).not.toBeInTheDocument();
  });

  it("should render nothing when wellness is undefined", () => {
    // Arrange
    const wellness = undefined;

    // Act
    renderBand(wellness);

    // Assert
    expect(screen.queryByTestId("wellness-band")).not.toBeInTheDocument();
  });

  it("should give each badge an aria-label and the route from the map", () => {
    // Arrange
    const wellness: DayWellness = { sleep: "82", hrv: "45" };

    // Act
    renderBand(wellness);

    // Assert
    const sleep = screen.getByRole("link", { name: "Sleep 82" });
    const hrv = screen.getByRole("link", { name: "HRV 45" });
    expect(sleep).toHaveAttribute("href", "/health/sleep");
    expect(hrv).toHaveAttribute("href", "/health/recovery");
  });

  it("should route weight and steps badges to their pages", () => {
    // Arrange
    const wellness: DayWellness = { weight: "72.4", steps: "9432" };

    // Act
    renderBand(wellness);

    // Assert
    expect(screen.getByRole("link", { name: "Weight 72.4" })).toHaveAttribute(
      "href",
      "/health/weight"
    );
    expect(screen.getByRole("link", { name: "Steps 9432" })).toHaveAttribute(
      "href",
      "/health/activity"
    );
  });

  it("should use a muted band class distinct from brand-coloured cards", () => {
    // Arrange
    const wellness: DayWellness = { sleep: "82" };

    // Act
    renderBand(wellness);

    // Assert
    const band = screen.getByTestId("wellness-band");
    expect(band.className).toContain("border-gray-200");
    expect(band.className).not.toContain("border-emerald");
    expect(band.className).not.toContain("border-l-4");
  });

  it("should render a net badge linking to the nutrition page", () => {
    // Arrange
    const wellness: DayWellness = { net: "-600" };

    // Act
    renderBand(wellness);

    // Assert
    expect(screen.getByTestId("wellness-badge-net")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Net -600" })).toHaveAttribute(
      "href",
      "/nutrition"
    );
  });

  it("should omit the net badge when no net is present", () => {
    // Arrange
    const wellness: DayWellness = { sleep: "82" };

    // Act
    renderBand(wellness);

    // Assert
    expect(screen.queryByTestId("wellness-badge-net")).not.toBeInTheDocument();
  });

  it("should render four badges for a dense day without dropping any", () => {
    // Arrange
    const wellness: DayWellness = {
      sleep: "82",
      hrv: "45",
      weight: "72.4",
      steps: "9432",
    };

    // Act
    renderBand(wellness);

    // Assert
    const band = screen.getByTestId("wellness-band");
    const ALL_FOUR_METRICS = 4;
    expect(band.querySelectorAll("a")).toHaveLength(ALL_FOUR_METRICS);
    expect(band.className).toContain("flex-wrap");
  });
});
