/**
 * Tests for `CoachingDialogShell` — the Radix Dialog chrome used by
 * `CoachingActivityDialog`. Verifies overlay/content render and that
 * onClose fires when the user dismisses the dialog (Escape key).
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CoachingDialogShell } from "./coaching-dialog-shell";

describe("CoachingDialogShell", () => {
  it("should render the dialog chrome and the children", () => {
    // Arrange

    // Act
    render(
      <CoachingDialogShell onClose={vi.fn()}>
        <p>Body content</p>
      </CoachingDialogShell>
    );

    // Assert
    expect(screen.getByTestId("coaching-activity-dialog")).toBeInTheDocument();
    expect(screen.getByText("Body content")).toBeInTheDocument();
  });

  it("should expose an accessible dialog title", () => {
    // Arrange

    // Act
    render(
      <CoachingDialogShell onClose={vi.fn()}>
        <p>Body</p>
      </CoachingDialogShell>
    );

    // Assert
    expect(
      screen.getByRole("dialog", { name: "Coaching activity" })
    ).toBeInTheDocument();
  });

  it("should fire onClose when the user dismisses the dialog with Escape", async () => {
    // Arrange
    const onClose = vi.fn();

    // Act
    render(
      <CoachingDialogShell onClose={onClose}>
        <p>Body</p>
      </CoachingDialogShell>
    );
    await userEvent.keyboard("{Escape}");

    // Assert
    expect(onClose).toHaveBeenCalled();
  });
});
