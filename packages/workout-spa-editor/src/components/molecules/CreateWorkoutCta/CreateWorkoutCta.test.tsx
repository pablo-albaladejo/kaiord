import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { CreateWorkoutCta } from "./CreateWorkoutCta";

function renderCta(ui: React.ReactNode) {
  const loc = memoryLocation({ path: "/calendar", record: true });
  render(<Router hook={loc.hook}>{ui}</Router>);
  return loc;
}

describe("CreateWorkoutCta", () => {
  it("should render the magenta action variant with the nav label", () => {
    // Arrange

    // Act
    renderCta(<CreateWorkoutCta origin="library" />);
    const button = screen.getByTestId("create-workout-cta");

    // Assert
    expect(button).toHaveClass("bg-action");
    expect(button).toHaveTextContent("New workout");
  });

  it("should navigate to the editor carrying its route's origin", async () => {
    // Arrange
    const user = userEvent.setup();
    const location = renderCta(<CreateWorkoutCta origin="daily" />);

    // Act
    await user.click(screen.getByTestId("create-workout-cta"));

    // Assert
    expect(location.history).toContain("/workout/new?from=daily");
  });

  it("should carry the week so closing the editor returns to it", async () => {
    // Arrange
    const user = userEvent.setup();
    const location = renderCta(
      <CreateWorkoutCta origin="calendar" week="2026-W32" />
    );

    // Act
    await user.click(screen.getByTestId("create-workout-cta"));

    // Assert
    expect(location.history).toContain(
      "/workout/new?from=calendar&week=2026-W32"
    );
  });

  it("should stay hidden below md, where the create FAB covers it", () => {
    // Arrange

    // Act
    renderCta(<CreateWorkoutCta origin="calendar" />);
    const button = screen.getByTestId("create-workout-cta");

    // Assert
    expect(button).toHaveClass("hidden", "md:inline-flex");
  });
});
