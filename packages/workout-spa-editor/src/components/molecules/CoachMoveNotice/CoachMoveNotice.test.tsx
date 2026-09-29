import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CoachMoveNotice } from "./CoachMoveNotice";

describe("CoachMoveNotice", () => {
  it("should count the moves and point to sending the week", () => {
    // Arrange
    const moves = { coachMoves: 2, overriddenLocalMoves: 0 };

    // Act
    render(<CoachMoveNotice moves={moves} onDismiss={vi.fn()} />);

    // Assert
    expect(screen.getByRole("status")).toHaveTextContent(
      "2 sessions moved to the coach's new dates. Send the week to update Garmin."
    );
  });

  it("should name the overridden moves only when there are some", () => {
    // Arrange
    const moves = { coachMoves: 1, overriddenLocalMoves: 1 };

    // Act
    render(<CoachMoveNotice moves={moves} onDismiss={vi.fn()} />);

    // Assert
    expect(screen.getByRole("status")).toHaveTextContent(
      "2 sessions moved to the coach's new dates. 1 of them replaced a day you had chosen."
    );
  });

  it("should keep the dismiss button outside the status text", async () => {
    // Arrange
    const onDismiss = vi.fn();
    render(
      <CoachMoveNotice
        moves={{ coachMoves: 1, overriddenLocalMoves: 0 }}
        onDismiss={onDismiss}
      />
    );
    const button = screen.getByRole("button", { name: "Dismiss" });

    // Act
    await userEvent.click(button);

    // Assert
    expect(screen.getByRole("status")).not.toContainElement(button);
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
