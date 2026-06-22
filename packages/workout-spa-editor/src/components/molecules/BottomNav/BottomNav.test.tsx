import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { BottomNav } from "./BottomNav";

const TAB_COUNT = 5;

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
  it("should render five tabs and the create FAB", () => {
    // Arrange
    renderAt("/daily");

    // Act
    const nav = screen.getByRole("navigation", { name: "Primary" });
    const tabButtons = [
      "Daily",
      "Calendar",
      "Library",
      "Nutrition",
      "Athlete",
    ].map((name) => screen.getByRole("button", { name }));
    const fab = screen.getByRole("button", { name: "Create workout" });

    // Assert
    expect(nav).toBeInTheDocument();
    expect(tabButtons).toHaveLength(TAB_COUNT);
    expect(fab).toBeInTheDocument();
  });

  it("should mark the Nutrition tab active on the nutrition route", () => {
    // Arrange
    renderAt("/nutrition");

    // Act
    const nutrition = screen.getByRole("button", { name: "Nutrition" });
    const daily = screen.getByRole("button", { name: "Daily" });

    // Assert
    expect(nutrition).toHaveAttribute("aria-current", "page");
    expect(daily).not.toHaveAttribute("aria-current");
  });

  it("should navigate to the nutrition route when the Nutrition tab is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    const { history } = renderAt("/daily");

    // Act
    await user.click(screen.getByRole("button", { name: "Nutrition" }));

    // Assert
    expect(history.at(-1)).toBe("/nutrition");
  });

  it("should mark the Daily tab active on the daily route", () => {
    // Arrange
    renderAt("/daily");

    // Act
    const daily = screen.getByRole("button", { name: "Daily" });

    // Assert
    expect(daily).toHaveAttribute("aria-current", "page");
  });

  it("should render the FAB notch spacer immediately before the Nutrition tab", () => {
    // Arrange
    renderAt("/daily");

    // Act
    const nutritionWrapper = screen.getByRole("button", {
      name: "Nutrition",
    }).parentElement;
    const libraryWrapper = screen.getByRole("button", {
      name: "Library",
    }).parentElement;

    // Assert
    // The notch spacer renders inside the wrapper at NOTCH_INDEX (Nutrition,
    // index 3) and nowhere else — pinning "between Library and Nutrition".
    expect(
      nutritionWrapper?.querySelector('span[aria-hidden="true"]')
    ).not.toBeNull();
    expect(
      libraryWrapper?.querySelector('span[aria-hidden="true"]')
    ).toBeNull();
  });

  it("should mark the Library tab active on the library route", () => {
    // Arrange
    renderAt("/library");

    // Act
    const library = screen.getByRole("button", { name: "Library" });
    const daily = screen.getByRole("button", { name: "Daily" });

    // Assert
    expect(library).toHaveAttribute("aria-current", "page");
    expect(daily).not.toHaveAttribute("aria-current");
  });

  it("should not offer a Settings tab (header-only since the /daily split)", () => {
    // Arrange
    renderAt("/settings/ai");

    // Act
    const settings = screen.queryByRole("button", { name: "Settings" });

    // Assert
    expect(settings).not.toBeInTheDocument();
  });

  it("should mark the Calendar tab active on a week-grid calendar route", () => {
    // Arrange
    renderAt("/calendar/2026-W23");

    // Act
    const calendar = screen.getByRole("button", { name: "Calendar" });
    const daily = screen.getByRole("button", { name: "Daily" });

    // Assert
    expect(calendar).toHaveAttribute("aria-current", "page");
    expect(daily).not.toHaveAttribute("aria-current");
  });

  it("should navigate to the new workout route when the FAB is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    const { history } = renderAt("/daily");

    // Act
    await user.click(screen.getByRole("button", { name: "Create workout" }));

    // Assert
    expect(history.at(-1)).toBe("/workout/new");
  });

  it("should navigate to the library route when the Library tab is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    const { history } = renderAt("/daily");

    // Act
    await user.click(screen.getByRole("button", { name: "Library" }));

    // Assert
    expect(history.at(-1)).toBe("/library");
  });
});
