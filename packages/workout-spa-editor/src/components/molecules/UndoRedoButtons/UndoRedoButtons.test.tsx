import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { UndoRedoButtons } from "./UndoRedoButtons";

describe("UndoRedoButtons", () => {
  const defaultProps = {
    canUndo: true,
    canRedo: true,
    onUndo: vi.fn(),
    onRedo: vi.fn(),
  };

  it("renders undo and redo buttons", () => {
    render(<UndoRedoButtons {...defaultProps} />);

    expect(screen.getByTestId("undo-button")).toBeInTheDocument();
    expect(screen.getByTestId("redo-button")).toBeInTheDocument();
  });

  it("calls onUndo when undo button is clicked", async () => {
    const user = userEvent.setup();
    const onUndo = vi.fn();

    render(<UndoRedoButtons {...defaultProps} onUndo={onUndo} />);

    await user.click(screen.getByTestId("undo-button"));

    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it("calls onRedo when redo button is clicked", async () => {
    const user = userEvent.setup();
    const onRedo = vi.fn();

    render(<UndoRedoButtons {...defaultProps} onRedo={onRedo} />);

    await user.click(screen.getByTestId("redo-button"));

    expect(onRedo).toHaveBeenCalledTimes(1);
  });

  it("disables undo button when canUndo is false", () => {
    render(<UndoRedoButtons {...defaultProps} canUndo={false} />);

    expect(screen.getByTestId("undo-button")).toBeDisabled();
  });

  it("disables redo button when canRedo is false", () => {
    render(<UndoRedoButtons {...defaultProps} canRedo={false} />);

    expect(screen.getByTestId("redo-button")).toBeDisabled();
  });

  it("has correct accessibility attributes", () => {
    render(<UndoRedoButtons {...defaultProps} />);

    const group = screen.getByRole("group");
    expect(group).toHaveAttribute("aria-label", "History controls");

    expect(screen.getByTestId("undo-button")).toHaveAttribute(
      "aria-label",
      "Undo last action"
    );
    expect(screen.getByTestId("redo-button")).toHaveAttribute(
      "aria-label",
      "Redo last action"
    );
  });
});
