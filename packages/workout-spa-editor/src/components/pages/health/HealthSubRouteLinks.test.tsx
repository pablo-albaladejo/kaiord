import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { HEALTH_SUB_ROUTES } from "./health-sub-routes";
import { HealthSubRouteLinks } from "./HealthSubRouteLinks";

function renderLinks(path = "/health") {
  const { hook } = memoryLocation({ path, record: true });
  return render(
    <Router hook={hook}>
      <HealthSubRouteLinks />
    </Router>
  );
}

const currentLinks = () =>
  screen
    .getAllByRole("link")
    .filter((link) => link.getAttribute("aria-current") === "page");

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

  it("should expose every health route, including the hub and labs", () => {
    // Arrange
    renderLinks();

    // Act
    const hrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));

    // Assert
    expect(hrefs).toEqual([
      "/health",
      "/health/sleep",
      "/health/recovery",
      "/health/weight",
      "/health/activity",
      "/health/labs",
    ]);
    expect(hrefs).toHaveLength(HEALTH_SUB_ROUTES.length);
  });

  it("should mark exactly the current route with aria-current", () => {
    // Arrange
    renderLinks("/health/labs");

    // Act
    const current = currentLinks();

    // Assert
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAttribute("href", "/health/labs");
  });

  it("should mark the hub current on a trailing-slash pathname", () => {
    // Arrange
    renderLinks("/health/");

    // Act
    const current = currentLinks();

    // Assert
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAttribute("href", "/health");
  });

  it("should not mark the hub current on a sub-route", () => {
    // Arrange
    renderLinks("/health/sleep");

    // Act
    const current = currentLinks();

    // Assert
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAttribute("href", "/health/sleep");
  });
});
