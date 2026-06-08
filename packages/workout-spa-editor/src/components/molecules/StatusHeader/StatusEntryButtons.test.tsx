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
  it("should mark the daily entry active on the Daily route", () => {
    // Arrange
    renderAt("/daily");

    // Act
    const daily = screen.getByTestId("status-header-daily-button");
    const calendar = screen.getByTestId("status-header-calendar-button");
    const library = screen.getByTestId("status-header-library-button");

    // Assert
    expect(daily).toHaveAttribute("aria-current", "page");
    expect(calendar).not.toHaveAttribute("aria-current");
    expect(library).not.toHaveAttribute("aria-current");
  });

  it("should mark the calendar entry active on a week-grid route", () => {
    // Arrange
    renderAt("/calendar/2026-W23");

    // Act
    const calendar = screen.getByTestId("status-header-calendar-button");
    const daily = screen.getByTestId("status-header-daily-button");

    // Assert
    expect(calendar).toHaveAttribute("aria-current", "page");
    expect(daily).not.toHaveAttribute("aria-current");
  });

  it("should mark the library entry active on the library route", () => {
    // Arrange
    renderAt("/library");

    // Act
    const library = screen.getByTestId("status-header-library-button");
    const calendar = screen.getByTestId("status-header-calendar-button");

    // Assert
    expect(library).toHaveAttribute("aria-current", "page");
    expect(calendar).not.toHaveAttribute("aria-current");
  });

  it("should mark the trends entry active on a nested health route", () => {
    // Arrange
    renderAt("/health/sleep");

    // Act
    const trends = screen.getByTestId("status-header-trends-button");

    // Assert
    expect(trends).toHaveAttribute("aria-current", "page");
  });

  it("should mark the settings entry active on a nested settings route", () => {
    // Arrange
    renderAt("/settings/ai");

    // Act
    const settings = screen.getByTestId("status-header-settings-button");

    // Assert
    expect(settings).toHaveAttribute("aria-current", "page");
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
});
