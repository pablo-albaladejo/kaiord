import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EmptyWorkoutState } from "./EmptyWorkoutState";

describe("EmptyWorkoutState", () => {
  it("should render heading and description", () => {
    const onAddStep = vi.fn();

    render(<EmptyWorkoutState onAddStep={onAddStep} />);

    expect(screen.getByText("Add your first step")).toBeInTheDocument();
    expect(
      screen.getByText("Start building your workout by adding steps")
    ).toBeInTheDocument();
  });

  it("should call onAddStep when button is clicked", async () => {
    const user = userEvent.setup();
    const onAddStep = vi.fn();

    render(<EmptyWorkoutState onAddStep={onAddStep} />);

    await user.click(screen.getByTestId("add-first-step-button"));

    expect(onAddStep).toHaveBeenCalledTimes(1);
  });

  it("should have correct accessibility attributes", () => {
    const onAddStep = vi.fn();

    render(<EmptyWorkoutState onAddStep={onAddStep} />);

    const button = screen.getByTestId("add-first-step-button");
    expect(button).toHaveAttribute("aria-label", "Add first step to workout");
  });
});
