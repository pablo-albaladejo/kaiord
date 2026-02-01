import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EmptyWorkoutState } from "./EmptyWorkoutState";

describe("EmptyWorkoutState", () => {
  it("renders heading and description", () => {
    const onAddStep = vi.fn();

    render(<EmptyWorkoutState onAddStep={onAddStep} />);

    expect(screen.getByText("Add your first step")).toBeInTheDocument();
    expect(
      screen.getByText("Start building your workout by adding steps")
    ).toBeInTheDocument();
  });

  it("calls onAddStep when button is clicked", async () => {
    const user = userEvent.setup();
    const onAddStep = vi.fn();

    render(<EmptyWorkoutState onAddStep={onAddStep} />);

    await user.click(screen.getByTestId("add-first-step-button"));

    expect(onAddStep).toHaveBeenCalledTimes(1);
  });

  it("displays keyboard shortcut hint", () => {
    const onAddStep = vi.fn();

    render(<EmptyWorkoutState onAddStep={onAddStep} />);

    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText(/to add a step/)).toBeInTheDocument();
  });

  it("has correct accessibility attributes", () => {
    const onAddStep = vi.fn();

    render(<EmptyWorkoutState onAddStep={onAddStep} />);

    const button = screen.getByTestId("add-first-step-button");
    expect(button).toHaveAttribute("aria-label", "Add first step to workout");
  });
});
