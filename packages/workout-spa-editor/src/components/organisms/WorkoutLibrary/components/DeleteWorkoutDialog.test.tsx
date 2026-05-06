/**
 * DeleteWorkoutDialog tests.
 *
 * Radix-based confirmation dialog. Closed when `open=false`, mounted
 * when `open=true`. The Cancel button and the dialog's onOpenChange
 * (Escape / overlay click) both go through onCancel; the Delete
 * button fires onConfirm.
 */

import { describe, expect, it, vi } from "vitest";

import { render, screen, userEvent } from "../../../../test-utils";
import { DeleteWorkoutDialog } from "./DeleteWorkoutDialog";

describe("DeleteWorkoutDialog", () => {
  it("should render nothing when open is false", () => {
    // Arrange

    // Act
    render(
      <DeleteWorkoutDialog
        open={false}
        workoutName="Tempo Ride"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Assert
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should render the dialog with the workout name in the description when open", () => {
    // Arrange

    // Act
    render(
      <DeleteWorkoutDialog
        open
        workoutName="Tempo Ride"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Assert
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Delete Workout")).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to delete "Tempo Ride"\?/)
    ).toBeInTheDocument();
  });

  it("should call onConfirm when the Delete button is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <DeleteWorkoutDialog
        open
        workoutName="Tempo Ride"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );

    // Act
    await user.click(screen.getByRole("button", { name: "Delete" }));

    // Assert
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("should call onCancel when the Cancel button is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <DeleteWorkoutDialog
        open
        workoutName="Tempo Ride"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    // Act
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    // Assert
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("should call onCancel when the dialog is dismissed via Escape", async () => {
    // Arrange
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <DeleteWorkoutDialog
        open
        workoutName="Tempo Ride"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    // Act
    await user.keyboard("{Escape}");

    // Assert
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
