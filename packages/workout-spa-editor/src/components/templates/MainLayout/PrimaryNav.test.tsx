/**
 * PrimaryNav — top-level Training / Health / Settings tab bar.
 *
 * Tests cover the six behaviours mandated by §7.2:
 *   - mounts with three labels in declared order
 *   - clicking Training from a Health URL navigates to /calendar
 *   - clicking Health from a Training URL navigates to /health
 *   - clicking Settings navigates to /settings/ai
 *   - the active tab is visually indicated via aria-current
 *   - re-clicking the active tab is a no-op (no new history entry)
 *
 * Plus §7.4 regression: existing deep links resolve with the right tab.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { PrimaryNav } from "./PrimaryNav";

const renderAtPath = (path: string) => {
  const { hook, history } = memoryLocation({ path, record: true });
  const utils = render(
    <Router hook={hook}>
      <PrimaryNav />
    </Router>
  );
  return { ...utils, history };
};

const EXPECTED_TAB_COUNT = 3;

describe("PrimaryNav", () => {
  it("should mount three tabs in order: Training, Health, Settings", () => {
    // Arrange
    renderAtPath("/calendar");

    // Act
    const tabs = screen.getAllByRole("tab");

    // Assert
    expect(tabs).toHaveLength(EXPECTED_TAB_COUNT);
    expect(tabs[0]).toHaveTextContent(/training/i);
    expect(tabs[1]).toHaveTextContent(/health/i);
    expect(tabs[2]).toHaveTextContent(/settings/i);
  });

  it("should navigate to /calendar when Training is clicked from a health URL", () => {
    // Arrange
    const { history } = renderAtPath("/health/sleep");

    // Act
    fireEvent.click(screen.getByRole("tab", { name: /training/i }));

    // Assert
    expect(history[history.length - 1]).toBe("/calendar");
  });

  it("should navigate to /health when Health is clicked from /calendar", () => {
    // Arrange
    const { history } = renderAtPath("/calendar");

    // Act
    fireEvent.click(screen.getByRole("tab", { name: /health/i }));

    // Assert
    expect(history[history.length - 1]).toBe("/health");
  });

  it("should navigate to /settings/ai when Settings is clicked", () => {
    // Arrange
    const { history } = renderAtPath("/calendar");

    // Act
    fireEvent.click(screen.getByRole("tab", { name: /settings/i }));

    // Assert
    expect(history[history.length - 1]).toBe("/settings/ai");
  });

  it("should mark the Training tab active for /calendar via aria-current", () => {
    // Arrange
    renderAtPath("/calendar");

    // Act
    const training = screen.getByRole("tab", { name: /training/i });

    // Assert
    expect(training).toHaveAttribute("aria-current", "page");
  });

  it("should mark the Health tab active for /health/sleep via aria-current", () => {
    // Arrange
    renderAtPath("/health/sleep");

    // Act
    const health = screen.getByRole("tab", { name: /health/i });

    // Assert
    expect(health).toHaveAttribute("aria-current", "page");
  });

  it("should mark the Settings tab active for any /settings/* URL", () => {
    // Arrange
    renderAtPath("/settings/ai");

    // Act
    const settings = screen.getByRole("tab", { name: /settings/i });

    // Assert
    expect(settings).toHaveAttribute("aria-current", "page");
  });

  it("should treat /library as Training-active (regression: deep links work)", () => {
    // Arrange
    renderAtPath("/library");

    // Act
    const training = screen.getByRole("tab", { name: /training/i });

    // Assert
    expect(training).toHaveAttribute("aria-current", "page");
  });

  it("should treat /workout/abc-123 as Training-active (regression)", () => {
    // Arrange
    renderAtPath("/workout/abc-123");

    // Act
    const training = screen.getByRole("tab", { name: /training/i });

    // Assert
    expect(training).toHaveAttribute("aria-current", "page");
  });

  it("should NOT add a history entry when the active tab is re-clicked", () => {
    // Arrange
    const { history } = renderAtPath("/calendar");
    const initialLength = history.length;

    // Act
    fireEvent.click(screen.getByRole("tab", { name: /training/i }));

    // Assert
    expect(history.length).toBe(initialLength);
  });
});
