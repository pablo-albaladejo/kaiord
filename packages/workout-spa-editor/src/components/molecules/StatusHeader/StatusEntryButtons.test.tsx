import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { renderWithProviders } from "../../../test-utils";
import { StatusEntryButtons } from "./StatusEntryButtons";

function renderAt(path: string) {
  const { hook } = memoryLocation({ path, record: true });
  return renderWithProviders(
    <Router hook={hook}>
      <StatusEntryButtons onHelpClick={vi.fn()} />
    </Router>
  );
}

describe("StatusEntryButtons", () => {
  it.each([
    { route: "/daily", testId: "status-header-daily-button" },
    { route: "/calendar/2026-W23", testId: "status-header-calendar-button" },
    { route: "/library", testId: "status-header-library-button" },
    { route: "/chat", testId: "status-header-chat-button" },
    { route: "/nutrition", testId: "status-header-nutrition-button" },
    { route: "/health/sleep", testId: "status-header-trends-button" },
    { route: "/settings/ai", testId: "status-header-settings-button" },
  ])("should mark the matching entry active on $route", ({ route, testId }) => {
    // Arrange
    renderAt(route);

    // Act
    const active = screen.getByTestId(testId);

    // Assert
    expect(active).toHaveAttribute("aria-current", "page");
  });

  it("should mark no primary entry active on an unrelated route", () => {
    // Arrange
    renderAt("/workout/view/abc");

    // Act
    const daily = screen.getByTestId("status-header-daily-button");
    const calendar = screen.getByTestId("status-header-calendar-button");
    const library = screen.getByTestId("status-header-library-button");
    const trends = screen.getByTestId("status-header-trends-button");

    // Assert
    expect(daily).not.toHaveAttribute("aria-current");
    expect(calendar).not.toHaveAttribute("aria-current");
    expect(library).not.toHaveAttribute("aria-current");
    expect(trends).not.toHaveAttribute("aria-current");
  });
  it("should not render a dedicated athlete entry (ProfileEntryButton owns /athlete)", () => {
    // Arrange
    renderAt("/daily");

    // Act
    const athlete = screen.queryByTestId("status-header-athlete-button");

    // Assert
    expect(athlete).toBeNull();
  });
});
