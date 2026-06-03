import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { BottomNav } from "./BottomNav";

const TAB_COUNT = 4;

function renderAt(path: string) {
  const { hook, history } = memoryLocation({ path, record: true });
  const view = render(
    <Router hook={hook}>
      <BottomNav />
    </Router>
  );
  return { ...view, history };
}

describe("BottomNav", () => {
  it("should render four tabs and the create FAB", () => {
    // Arrange
    renderAt("/calendar");

    // Act
    const nav = screen.getByRole("navigation", { name: "Primary" });
    const tabButtons = ["Today", "Library", "Athlete", "Settings"].map((name) =>
      screen.getByRole("button", { name })
    );
    const fab = screen.getByRole("button", { name: "Create workout" });

    // Assert
    expect(nav).toBeInTheDocument();
    expect(tabButtons).toHaveLength(TAB_COUNT);
    expect(fab).toBeInTheDocument();
  });

  it("should mark the Today tab active on the calendar route", () => {
    // Arrange
    renderAt("/calendar");

    // Act
    const today = screen.getByRole("button", { name: "Today" });

    // Assert
    expect(today).toHaveAttribute("aria-current", "page");
  });

  it("should mark the Library tab active on the library route", () => {
    // Arrange
    renderAt("/library");

    // Act
    const library = screen.getByRole("button", { name: "Library" });
    const today = screen.getByRole("button", { name: "Today" });

    // Assert
    expect(library).toHaveAttribute("aria-current", "page");
    expect(today).not.toHaveAttribute("aria-current");
  });

  it("should mark the Settings tab active on a nested settings route", () => {
    // Arrange
    renderAt("/settings/ai");

    // Act
    const settings = screen.getByRole("button", { name: "Settings" });

    // Assert
    expect(settings).toHaveAttribute("aria-current", "page");
  });

  it("should mark the Today tab active on a week-grid calendar route", () => {
    // Arrange
    renderAt("/calendar/2026-W23");

    // Act
    const today = screen.getByRole("button", { name: "Today" });
    const library = screen.getByRole("button", { name: "Library" });

    // Assert
    expect(today).toHaveAttribute("aria-current", "page");
    expect(library).not.toHaveAttribute("aria-current");
  });

  it("should navigate to the new workout route when the FAB is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    const { history } = renderAt("/calendar");

    // Act
    await user.click(screen.getByRole("button", { name: "Create workout" }));

    // Assert
    expect(history.at(-1)).toBe("/workout/new");
  });

  it("should navigate to the library route when the Library tab is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    const { history } = renderAt("/calendar");

    // Act
    await user.click(screen.getByRole("button", { name: "Library" }));

    // Assert
    expect(history.at(-1)).toBe("/library");
  });
});
