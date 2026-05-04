/**
 * EditableZoneValue Component Tests
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EditableZoneValue } from "./EditableZoneValue";

describe("EditableZoneValue", () => {
  it("should render value as a button", () => {
    // Arrange

    // Act

    render(<EditableZoneValue value="120" onSave={vi.fn()} ariaLabel="test" />);

    // Assert

    expect(screen.getByRole("button", { name: "test" })).toHaveTextContent(
      "120"
    );
  });

  it("should show input on click", async () => {
    // Arrange

    const user = userEvent.setup();

    render(<EditableZoneValue value="120" onSave={vi.fn()} ariaLabel="test" />);

    // Act

    await user.click(screen.getByRole("button", { name: "test" }));

    // Assert

    expect(screen.getByRole("textbox", { name: "test" })).toBeInTheDocument();
  });

  it("should call onSave on blur with changed value", async () => {
    // Arrange

    const onSave = vi.fn();
    const user = userEvent.setup();

    render(<EditableZoneValue value="120" onSave={onSave} ariaLabel="test" />);
    await user.click(screen.getByRole("button", { name: "test" }));

    const input = screen.getByRole("textbox", { name: "test" });
    await user.clear(input);
    await user.type(input, "130");

    // Act

    await user.tab();

    // Assert

    expect(onSave).toHaveBeenCalledWith("130");
  });

  it("should call onSave on Enter", async () => {
    // Arrange

    const onSave = vi.fn();
    const user = userEvent.setup();

    render(<EditableZoneValue value="120" onSave={onSave} ariaLabel="test" />);
    await user.click(screen.getByRole("button", { name: "test" }));

    const input = screen.getByRole("textbox", { name: "test" });
    fireEvent.change(input, { target: { value: "150" } });

    // Act

    fireEvent.blur(input);

    // Assert

    expect(onSave).toHaveBeenCalledWith("150");
  });

  it("should not call onSave if value unchanged", async () => {
    // Arrange

    const onSave = vi.fn();
    const user = userEvent.setup();

    render(<EditableZoneValue value="120" onSave={onSave} ariaLabel="test" />);
    await user.click(screen.getByRole("button", { name: "test" }));

    // Act

    await user.tab();

    // Assert

    expect(onSave).not.toHaveBeenCalled();
  });

  it("should cancel edit on Escape without saving", async () => {
    // Arrange

    const onSave = vi.fn();
    const user = userEvent.setup();

    render(<EditableZoneValue value="120" onSave={onSave} ariaLabel="test" />);
    await user.click(screen.getByRole("button", { name: "test" }));

    const input = screen.getByRole("textbox", { name: "test" });
    await user.clear(input);
    await user.type(input, "999");

    // Act

    await user.keyboard("{Escape}");

    // Assert

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "test" })).toBeInTheDocument();
    });
    expect(onSave).not.toHaveBeenCalled();
  });
});
