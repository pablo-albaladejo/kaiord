import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { HealthSubRouteLinks } from "./HealthSubRouteLinks";

function renderLinks() {
  const { hook } = memoryLocation({ path: "/health", record: true });
  return render(
    <Router hook={hook}>
      <HealthSubRouteLinks />
    </Router>
  );
}

describe("HealthSubRouteLinks", () => {
  it("should render a link grid for the health sub-routes", () => {
    // Arrange
    renderLinks();

    // Act
    const grid = screen.getByTestId("health-sub-route-links");

    // Assert
    expect(grid).toBeInTheDocument();
    expect(grid.getAttribute("aria-label")).toBe("Health detail pages");
  });

  it("should point each link at its WELLNESS_BADGE_ROUTES destination", () => {
    // Arrange
    renderLinks();

    // Act
    const sleep = screen.getByRole("link", { name: "Sleep" });
    const recovery = screen.getByRole("link", { name: "Recovery" });
    const weight = screen.getByRole("link", { name: "Weight" });
    const activity = screen.getByRole("link", { name: "Activity" });

    // Assert
    expect(sleep).toHaveAttribute("href", "/health/sleep");
    expect(recovery).toHaveAttribute("href", "/health/recovery");
    expect(weight).toHaveAttribute("href", "/health/weight");
    expect(activity).toHaveAttribute("href", "/health/activity");
  });
});
