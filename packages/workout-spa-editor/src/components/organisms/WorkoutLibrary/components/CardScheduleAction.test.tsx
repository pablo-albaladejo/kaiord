/**
 * CardScheduleAction tests.
 *
 * Single-button surface that fires onSchedule when activated. Renders
 * a calendar icon plus the literal "Schedule" label.
 */

import { describe, expect, it, vi } from "vitest";

import { render, screen, userEvent } from "../../../../test-utils";
import { CardScheduleAction } from "./CardScheduleAction";

describe("CardScheduleAction", () => {
  it("should render a Schedule button", () => {
    // Arrange

    // Act
    render(<CardScheduleAction onSchedule={vi.fn()} />);

    // Assert
    expect(
      screen.getByRole("button", { name: /schedule/i })
    ).toBeInTheDocument();
  });

  it("should call onSchedule once when the button is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    const onSchedule = vi.fn();
    render(<CardScheduleAction onSchedule={onSchedule} />);

    // Act
    await user.click(screen.getByRole("button", { name: /schedule/i }));

    // Assert
    expect(onSchedule).toHaveBeenCalledTimes(1);
  });
});
