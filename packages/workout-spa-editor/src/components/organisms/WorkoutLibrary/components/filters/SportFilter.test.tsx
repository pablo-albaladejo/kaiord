/* eslint-disable no-magic-numbers -- option counts and call ordinals are literal for clarity */

/**
 * SportFilter tests.
 *
 * Controlled <select> exposing five sport options (all / cycling /
 * running / swimming / generic). Verifies value reflection and
 * onChange forwarding.
 */

import { describe, expect, it, vi } from "vitest";

import { render, screen, userEvent } from "../../../../../test-utils";
import { SportFilter } from "./SportFilter";

describe("SportFilter", () => {
  it("should render the Sport label and five options", () => {
    // Arrange

    // Act
    render(<SportFilter value="all" onChange={vi.fn()} />);

    // Assert
    const select = screen.getByLabelText("Sport") as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(select.options).toHaveLength(5);
  });

  it("should reflect the controlled value", () => {
    // Arrange

    // Act
    render(<SportFilter value="cycling" onChange={vi.fn()} />);

    // Assert
    expect(screen.getByLabelText("Sport")).toHaveValue("cycling");
  });

  it("should call onChange with the picked sport for each option", async () => {
    // Arrange
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SportFilter value="all" onChange={onChange} />);

    // Act
    await user.selectOptions(screen.getByLabelText("Sport"), "running");
    await user.selectOptions(screen.getByLabelText("Sport"), "swimming");
    await user.selectOptions(screen.getByLabelText("Sport"), "generic");

    // Assert
    expect(onChange).toHaveBeenNthCalledWith(1, "running");
    expect(onChange).toHaveBeenNthCalledWith(2, "swimming");
    expect(onChange).toHaveBeenNthCalledWith(3, "generic");
  });

  it("should call onChange with all when the user resets to All Sports", async () => {
    // Arrange
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SportFilter value="cycling" onChange={onChange} />);

    // Act
    await user.selectOptions(screen.getByLabelText("Sport"), "all");

    // Assert
    expect(onChange).toHaveBeenCalledWith("all");
  });
});
