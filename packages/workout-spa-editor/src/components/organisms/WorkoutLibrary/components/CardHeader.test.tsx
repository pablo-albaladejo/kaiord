/**
 * CardHeader tests.
 *
 * Displays the workout name plus an aria-labelled delete button. The
 * delete button is hover-revealed in the design system but the test
 * surface only cares about (a) name rendering, (b) accessible label,
 * (c) onDelete callback firing on click.
 */

import { describe, expect, it, vi } from "vitest";

import { render, screen, userEvent } from "../../../../test-utils";
import { CardHeader } from "./CardHeader";

describe("CardHeader", () => {
  it("should render the workout name as a heading", () => {
    // Arrange

    // Act
    render(<CardHeader workoutName="Tempo Ride" onDelete={vi.fn()} />);

    // Assert
    expect(
      screen.getByRole("heading", { name: "Tempo Ride", level: 3 })
    ).toBeInTheDocument();
  });

  it("should expose an accessible delete button labelled with the workout name", () => {
    // Arrange

    // Act
    render(<CardHeader workoutName="Tempo Ride" onDelete={vi.fn()} />);

    // Assert
    expect(
      screen.getByRole("button", { name: "Delete Tempo Ride" })
    ).toBeInTheDocument();
  });

  it("should call onDelete once when the delete button is activated", async () => {
    // Arrange
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<CardHeader workoutName="Tempo Ride" onDelete={onDelete} />);

    // Act
    await user.click(screen.getByRole("button", { name: "Delete Tempo Ride" }));

    // Assert
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
