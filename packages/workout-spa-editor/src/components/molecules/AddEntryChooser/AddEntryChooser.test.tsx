/**
 * AddEntryChooser tests — the first step of the per-day add-entry flow.
 * Asserts the two choices are presented, that each fires `onChoose` with
 * the right branch, and that the accessible name carries the bound date.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AddEntryChooser } from "./AddEntryChooser";

const DAY = "2026-05-04";

describe("AddEntryChooser", () => {
  it("should render exactly the Workout and Wellness choices", () => {
    // Arrange

    // Act
    render(
      <AddEntryChooser
        open
        onOpenChange={vi.fn()}
        date={DAY}
        onChoose={vi.fn()}
      />
    );

    // Assert
    expect(screen.getByTestId("add-entry-choose-workout")).toBeInTheDocument();
    expect(screen.getByTestId("add-entry-choose-wellness")).toBeInTheDocument();
  });

  it("should call onChoose with workout when the Workout tile is clicked", async () => {
    // Arrange
    const onChoose = vi.fn();
    const user = userEvent.setup();
    render(
      <AddEntryChooser
        open
        onOpenChange={vi.fn()}
        date={DAY}
        onChoose={onChoose}
      />
    );

    // Act
    await user.click(screen.getByTestId("add-entry-choose-workout"));

    // Assert
    expect(onChoose).toHaveBeenCalledWith("workout");
  });

  it("should call onChoose with wellness when the Wellness tile is clicked", async () => {
    // Arrange
    const onChoose = vi.fn();
    const user = userEvent.setup();
    render(
      <AddEntryChooser
        open
        onOpenChange={vi.fn()}
        date={DAY}
        onChoose={onChoose}
      />
    );

    // Act
    await user.click(screen.getByTestId("add-entry-choose-wellness"));

    // Assert
    expect(onChoose).toHaveBeenCalledWith("wellness");
  });

  it("should include the formatted date in the dialog accessible name", () => {
    // Arrange

    // Act
    render(
      <AddEntryChooser
        open
        onOpenChange={vi.fn()}
        date={DAY}
        onChoose={vi.fn()}
      />
    );

    // Assert
    expect(
      screen.getByRole("dialog", { name: /Monday, May 4/i })
    ).toBeInTheDocument();
  });
});
