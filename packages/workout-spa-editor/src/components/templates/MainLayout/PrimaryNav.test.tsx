/**
 * PrimaryNav — top-level Training / Health / Settings nav.
 *
 * Tests cover the six §7.2 behaviours, adapted to the post-review
 * semantic-link design:
 *   - mounts three items in declared order
 *   - clicking Training from a Health URL navigates to /calendar
 *   - clicking Health from a Training URL navigates to /health
 *   - clicking Settings navigates to /settings/ai
 *   - the active tab carries aria-current="page" and is non-clickable
 *   - re-clicking the active tab is a no-op (active item has no click
 *     target — it's rendered as a `<span>`, not a `<Link>`)
 *
 * Plus §7.4 regression: existing deep links resolve with the right
 * tab marked active.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { PrimaryNav } from "./PrimaryNav";

const EXPECTED_NAV_ITEMS = 3;

const renderAtPath = (path: string) => {
  const { hook, history } = memoryLocation({ path, record: true });
  const utils = render(
    <Router hook={hook}>
      <PrimaryNav />
    </Router>
  );
  return { ...utils, history };
};

const navItem = (id: "training" | "health" | "settings") =>
  screen.getByTestId(`primary-nav-${id}`);

describe("PrimaryNav", () => {
  it("should mount three items in order: Training, Health, Settings", () => {
    // Arrange
    renderAtPath("/calendar");

    // Act
    const items = screen.getAllByTestId(
      /^primary-nav-(training|health|settings)$/
    );

    // Assert
    expect(items).toHaveLength(EXPECTED_NAV_ITEMS);
    expect(items[0]).toHaveTextContent(/training/i);
    expect(items[1]).toHaveTextContent(/health/i);
    expect(items[2]).toHaveTextContent(/settings/i);
  });

  it("should navigate to /calendar when Training is clicked from a health URL", () => {
    // Arrange
    const { history } = renderAtPath("/health/sleep");

    // Act
    fireEvent.click(navItem("training"));

    // Assert
    expect(history[history.length - 1]).toBe("/calendar");
  });

  it("should navigate to /health when Health is clicked from /calendar", () => {
    // Arrange
    const { history } = renderAtPath("/calendar");

    // Act
    fireEvent.click(navItem("health"));

    // Assert
    expect(history[history.length - 1]).toBe("/health");
  });

  it("should navigate to /settings/ai when Settings is clicked", () => {
    // Arrange
    const { history } = renderAtPath("/calendar");

    // Act
    fireEvent.click(navItem("settings"));

    // Assert
    expect(history[history.length - 1]).toBe("/settings/ai");
  });

  it("should mark the Training item active for /calendar via aria-current", () => {
    // Arrange
    renderAtPath("/calendar");

    // Act
    const training = navItem("training");

    // Assert
    expect(training).toHaveAttribute("aria-current", "page");
  });

  it("should mark the Health item active for /health/sleep via aria-current", () => {
    // Arrange
    renderAtPath("/health/sleep");

    // Act
    const health = navItem("health");

    // Assert
    expect(health).toHaveAttribute("aria-current", "page");
  });

  it("should mark the Settings item active for any /settings/* URL", () => {
    // Arrange
    renderAtPath("/settings/ai");

    // Act
    const settings = navItem("settings");

    // Assert
    expect(settings).toHaveAttribute("aria-current", "page");
  });

  it("should treat /library as Training-active (regression: deep links work)", () => {
    // Arrange
    renderAtPath("/library");

    // Act
    const training = navItem("training");

    // Assert
    expect(training).toHaveAttribute("aria-current", "page");
  });

  it("should treat /workout/abc-123 as Training-active (regression)", () => {
    // Arrange
    renderAtPath("/workout/abc-123");

    // Act
    const training = navItem("training");

    // Assert
    expect(training).toHaveAttribute("aria-current", "page");
  });

  it("should render the active item as a non-link (re-click is a no-op)", () => {
    // Arrange
    const { history } = renderAtPath("/calendar");
    const initialLength = history.length;

    // Act
    fireEvent.click(navItem("training"));

    // Assert
    expect(history.length).toBe(initialLength);
    expect(navItem("training").tagName).toBe("SPAN");
  });
});
