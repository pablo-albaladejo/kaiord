import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { db } from "../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../adapters/dexie/dexie-persistence-adapter";
import { PersistenceProvider } from "../../contexts/persistence-context";
import { ToastContextProvider } from "../../contexts/ToastContext";
import { ToastProvider } from "../atoms/Toast";
import NewWorkoutPicker from "./NewWorkoutPicker";

function withRouter(ui: React.ReactNode, path = "/workout/new") {
  const loc = memoryLocation({ path, record: true });
  const wrapped = (
    <PersistenceProvider persistence={createDexiePersistence(db)}>
      <ToastProvider>
        <ToastContextProvider>
          <Router hook={loc.hook}>{ui}</Router>
        </ToastContextProvider>
      </ToastProvider>
    </PersistenceProvider>
  );
  return { ui: wrapped, location: loc };
}

describe("NewWorkoutPicker", () => {
  beforeEach(async () => {
    await db.table("workouts").clear();
    await db.table("templates").clear();
    await db.table("meta").clear();
  });

  it("should render the title and subtitle without a date", () => {
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

  it("should render a date-aware heading when ?date= is present", () => {
    // Arrange
    const { ui } = withRouter(
      <NewWorkoutPicker />,
      "/workout/new?date=2026-03-15"
    );

    // Act
    render(ui);

    // Assert
    expect(
      screen.getByText("Schedule for Sunday, March 15")
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

  it("should navigate to /workout/new?source=scratch when From scratch is clicked without date", async () => {
    // Arrange
    const user = userEvent.setup();
    const { ui, location } = withRouter(<NewWorkoutPicker />);
    render(ui);

    // Act
    await user.click(screen.getByTestId("new-workout-picker-scratch"));

    // Assert
    expect(location.history.at(-1)).toBe("/workout/new?source=scratch");
  });

  it("should propagate ?date= to the Scratch tile navigation", async () => {
    // Arrange
    const user = userEvent.setup();
    const { ui, location } = withRouter(
      <NewWorkoutPicker />,
      "/workout/new?date=2026-03-15"
    );
    render(ui);

    // Act
    await user.click(screen.getByTestId("new-workout-picker-scratch"));

    // Assert
    expect(location.history.at(-1)).toBe(
      "/workout/new?source=scratch&date=2026-03-15"
    );
  });

  it("should navigate to /workout/new?action=import when Import is clicked without date", async () => {
    // Arrange
    const user = userEvent.setup();
    const { ui, location } = withRouter(<NewWorkoutPicker />);
    render(ui);

    // Act
    await user.click(screen.getByTestId("new-workout-picker-import"));

    // Assert
    expect(location.history.at(-1)).toBe("/workout/new?action=import");
  });

  it("should propagate ?date= to the Import tile navigation", async () => {
    // Arrange
    const user = userEvent.setup();
    const { ui, location } = withRouter(
      <NewWorkoutPicker />,
      "/workout/new?date=2026-03-15"
    );
    render(ui);

    // Act
    await user.click(screen.getByTestId("new-workout-picker-import"));

    // Assert
    expect(location.history.at(-1)).toBe(
      "/workout/new?action=import&date=2026-03-15"
    );
  });

  it("should navigate to /library?source=template-picker when From template is clicked without date", async () => {
    // Arrange
    const user = userEvent.setup();
    const { ui, location } = withRouter(<NewWorkoutPicker />);
    render(ui);

    // Act
    await user.click(screen.getByTestId("new-workout-picker-template"));

    // Assert
    expect(location.history.at(-1)).toBe("/library?source=template-picker");
  });

  it("should open TemplatePickerDialog inline (no navigation) when From template is clicked with ?date=", async () => {
    // Arrange
    const user = userEvent.setup();
    const { ui, location } = withRouter(
      <NewWorkoutPicker />,
      "/workout/new?date=2026-03-15"
    );
    render(ui);
    const initialPath = location.history.at(-1);

    // Act
    await user.click(screen.getByTestId("new-workout-picker-template"));

    // Assert
    expect(screen.getByTestId("template-picker-dialog")).toBeInTheDocument();
    expect(location.history.at(-1)).toBe(initialPath);
  });
});
