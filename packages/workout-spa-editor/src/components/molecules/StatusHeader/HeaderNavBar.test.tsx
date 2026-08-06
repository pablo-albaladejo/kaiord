import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { renderWithProviders } from "../../../test-utils";
import { HeaderNavBar } from "./HeaderNavBar";

function renderAt(path: string) {
  const loc = memoryLocation({ path, record: true });
  renderWithProviders(
    <Router hook={loc.hook}>
      <HeaderNavBar />
    </Router>
  );
  return loc;
}

describe("HeaderNavBar", () => {
  it.each([
    { route: "/daily", testId: "status-header-daily-button" },
    { route: "/calendar/2026-W23", testId: "status-header-calendar-button" },
    { route: "/library", testId: "status-header-library-button" },
    { route: "/nutrition", testId: "status-header-nutrition-button" },
    { route: "/athlete", testId: "status-header-athlete-button" },
    { route: "/chat", testId: "status-header-chat-button" },
    { route: "/health/sleep", testId: "status-header-trends-button" },
  ])("should mark the matching entry active on $route", ({ route, testId }) => {
    // Arrange
    renderAt(route);

    // Act
    const active = screen.getByTestId(testId);

    // Assert
    expect(active).toHaveAttribute("aria-current", "page");
  });

  it("should mark no entry active on an unrelated route", () => {
    // Arrange
    renderAt("/workout/view/abc");

    // Act
    const marked = screen
      .getAllByRole("button")
      .filter((button) => button.getAttribute("aria-current") === "page");

    // Assert
    expect(marked).toEqual([]);
  });

  it("should give Athlete its own named entry instead of an account chip", () => {
    // Arrange
    renderAt("/daily");

    // Act
    const athlete = screen.getByTestId("status-header-athlete-button");

    // Assert
    expect(athlete).toHaveAccessibleName("Open athlete profile");
  });

  it("should keep Settings out of the nav bar", () => {
    // Arrange
    renderAt("/daily");

    // Act
    const settings = screen.queryByTestId("status-header-settings-button");

    // Assert
    expect(settings).toBeNull();
  });

  it("should render Trends as a dropdown and not Labs as a sibling", () => {
    // Arrange
    renderAt("/daily");

    // Act
    const labsInBar = screen.queryByTestId("status-header-labs-button");

    // Assert
    expect(screen.getByTestId("status-header-trends-button")).toHaveAttribute(
      "aria-haspopup",
      "menu"
    );
    expect(labsInBar).toBeNull();
  });

  it("should reach Labs through the Trends dropdown", async () => {
    // Arrange
    const user = userEvent.setup();
    const loc = renderAt("/daily");

    // Act
    await user.click(screen.getByTestId("status-header-trends-button"));
    await user.click(await screen.findByTestId("nav-menu-item-labs"));

    // Assert
    expect(loc.history).toContain("/health/labs");
  });

  it("should offer every hidden entry in the More menu", async () => {
    // Arrange
    const user = userEvent.setup();
    renderAt("/daily");

    // Act
    await user.click(screen.getByTestId("status-header-more-button"));
    const menu = await screen.findByTestId("nav-menu-more");

    // Assert
    expect(
      Array.from(menu.querySelectorAll("[data-testid^='nav-menu-item-']")).map(
        (item) => item.getAttribute("data-testid")
      )
    ).toEqual([
      "nav-menu-item-nutrition",
      "nav-menu-item-trends",
      "nav-menu-item-labs",
      "nav-menu-item-chat",
    ]);
  });

  it("should hide bottom-nav-duplicated entries below md", () => {
    // Arrange
    renderAt("/daily");

    // Act
    const daily = screen.getByTestId("status-header-daily-button");

    // Assert
    expect(daily.parentElement).toHaveClass("hidden", "md:inline-flex");
    // The FAB-covered create entry left the bar entirely (`page` surface).
    expect(
      screen.queryByTestId("status-header-new-button")
    ).not.toBeInTheDocument();
  });

  it("should hold the overflow entries back until lg", () => {
    // Arrange
    renderAt("/daily");

    // Act
    const chat = screen.getByTestId("status-header-chat-button");
    const more = screen.getByTestId("status-header-more-button");

    // Assert
    expect(chat.parentElement).toHaveClass("hidden", "lg:inline-flex");
    expect(more.parentElement).toHaveClass("lg:hidden");
  });
});
