import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import NewWorkoutPicker from "./NewWorkoutPicker";

function withRouter(ui: React.ReactNode, path = "/workout/new") {
  const loc = memoryLocation({ path, record: true });
  return { ui: <Router hook={loc.hook}>{ui}</Router>, location: loc };
}

describe("NewWorkoutPicker", () => {
  it("should render the title and subtitle", () => {
    // Arrange
    const { ui } = withRouter(<NewWorkoutPicker />);

    // Act
    render(ui);

    // Assert
    expect(screen.getByText("Start a new workout")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Create from scratch, import a file (FIT/TCX/ZWO), or start from a template."
      )
    ).toBeInTheDocument();
  });

  it("should render the three picker tiles with the expected testids", () => {
    // Arrange
    const { ui } = withRouter(<NewWorkoutPicker />);

    // Act
    render(ui);

    // Assert
    expect(
      screen.getByTestId("new-workout-picker-scratch")
    ).toBeInTheDocument();
    expect(screen.getByTestId("new-workout-picker-import")).toBeInTheDocument();
    expect(
      screen.getByTestId("new-workout-picker-template")
    ).toBeInTheDocument();
  });

  it("should navigate to /workout/new?source=scratch when From scratch is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    const { ui, location } = withRouter(<NewWorkoutPicker />);
    render(ui);

    // Act
    await user.click(screen.getByTestId("new-workout-picker-scratch"));

    // Assert
    expect(location.history.at(-1)).toBe("/workout/new?source=scratch");
  });

  it("should navigate to /workout/new?action=import when Import is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    const { ui, location } = withRouter(<NewWorkoutPicker />);
    render(ui);

    // Act
    await user.click(screen.getByTestId("new-workout-picker-import"));

    // Assert
    expect(location.history.at(-1)).toBe("/workout/new?action=import");
  });

  it("should navigate to /library?source=template-picker when From template is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    const { ui, location } = withRouter(<NewWorkoutPicker />);
    render(ui);

    // Act
    await user.click(screen.getByTestId("new-workout-picker-template"));

    // Assert
    expect(location.history.at(-1)).toBe("/library?source=template-picker");
  });
});
