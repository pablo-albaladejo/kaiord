/**
 * EditableZoneName Component Tests
 */

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EditableZoneName } from "./EditableZoneName";

describe("EditableZoneName", () => {
  it("should render name as a button", () => {
    // Arrange

    // Act

    render(
      <EditableZoneName name="Endurance" onSave={vi.fn()} ariaLabel="test" />
    );

    // Assert

    expect(screen.getByRole("button", { name: "test" })).toHaveTextContent(
      "Endurance"
    );
  });

  it("should show input on click", async () => {
    // Arrange

    const user = userEvent.setup();

    render(
      <EditableZoneName name="Endurance" onSave={vi.fn()} ariaLabel="test" />
    );

    // Act

    await user.click(screen.getByRole("button", { name: "test" }));

    // Assert

    expect(screen.getByRole("textbox", { name: "test" })).toBeInTheDocument();
  });

  it("should call onSave on blur with changed value", async () => {
    // Arrange

    const onSave = vi.fn();
    const user = userEvent.setup();

    render(
      <EditableZoneName name="Endurance" onSave={onSave} ariaLabel="test" />
    );
    await user.click(screen.getByRole("button", { name: "test" }));

    const input = screen.getByRole("textbox", { name: "test" });
    await user.clear(input);
    await user.type(input, "Tempo");

    // Act

    await user.tab();

    // Assert

    expect(onSave).toHaveBeenCalledWith("Tempo");
  });

  it("should not save empty name", async () => {
    // Arrange

    const onSave = vi.fn();
    const user = userEvent.setup();

    render(
      <EditableZoneName name="Endurance" onSave={onSave} ariaLabel="test" />
    );
    await user.click(screen.getByRole("button", { name: "test" }));

    const input = screen.getByRole("textbox", { name: "test" });
    await user.clear(input);

    // Act

    await user.tab();

    // Assert

    expect(onSave).not.toHaveBeenCalled();
  });

  it("should save on Enter key", async () => {
    // Arrange

    const onSave = vi.fn();
    const user = userEvent.setup();

    render(
      <EditableZoneName name="Endurance" onSave={onSave} ariaLabel="test" />
    );
    await user.click(screen.getByRole("button", { name: "test" }));

    const input = screen.getByRole("textbox", { name: "test" });
    fireEvent.change(input, { target: { value: "Recovery" } });

    // Act

    fireEvent.blur(input);

    // Assert

    expect(onSave).toHaveBeenCalledWith("Recovery");
  });
});
