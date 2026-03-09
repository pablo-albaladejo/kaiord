/**
 * EditableZoneValue Component Tests
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EditableZoneValue } from "./EditableZoneValue";

describe("EditableZoneValue", () => {
  it("should render value as a button", () => {
    render(<EditableZoneValue value="120" onSave={vi.fn()} ariaLabel="test" />);

    expect(screen.getByRole("button", { name: "test" })).toHaveTextContent(
      "120"
    );
  });

  it("should show input on click", async () => {
    const user = userEvent.setup();

    render(<EditableZoneValue value="120" onSave={vi.fn()} ariaLabel="test" />);
    await user.click(screen.getByRole("button", { name: "test" }));

    expect(screen.getByRole("textbox", { name: "test" })).toBeInTheDocument();
  });

  it("should call onSave on blur with changed value", async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();

    render(<EditableZoneValue value="120" onSave={onSave} ariaLabel="test" />);
    await user.click(screen.getByRole("button", { name: "test" }));

    const input = screen.getByRole("textbox", { name: "test" });
    await user.clear(input);
    await user.type(input, "130");
    await user.tab();

    expect(onSave).toHaveBeenCalledWith("130");
  });

  it("should call onSave on Enter", async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();

    render(<EditableZoneValue value="120" onSave={onSave} ariaLabel="test" />);
    await user.click(screen.getByRole("button", { name: "test" }));

    const input = screen.getByRole("textbox", { name: "test" });
    await user.clear(input);
    await user.type(input, "150");
    await user.keyboard("{Enter}");

    expect(onSave).toHaveBeenCalledWith("150");
  });

  it("should not call onSave if value unchanged", async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();

    render(<EditableZoneValue value="120" onSave={onSave} ariaLabel="test" />);
    await user.click(screen.getByRole("button", { name: "test" }));
    await user.tab();

    expect(onSave).not.toHaveBeenCalled();
  });

  it("should cancel edit on Escape without saving", async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();

    render(<EditableZoneValue value="120" onSave={onSave} ariaLabel="test" />);
    await user.click(screen.getByRole("button", { name: "test" }));

    const input = screen.getByRole("textbox", { name: "test" });
    await user.clear(input);
    await user.type(input, "999");
    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "test" })).toBeInTheDocument();
    });
    expect(onSave).not.toHaveBeenCalled();
  });
});
