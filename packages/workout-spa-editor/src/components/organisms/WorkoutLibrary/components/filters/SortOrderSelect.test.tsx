/**
 * SortOrderSelect tests.
 *
 * Two-option controlled <select> (asc / desc). Verifies value
 * reflection and onChange forwarding for both directions.
 */

import { describe, expect, it, vi } from "vitest";

import { render, screen, userEvent } from "../../../../../test-utils";
import { SortOrderSelect } from "./SortOrderSelect";

describe("SortOrderSelect", () => {
  it("should render the Order label and two options", () => {
    // Arrange

    // Act
    render(<SortOrderSelect value="asc" onChange={vi.fn()} />);

    // Assert
    const select = screen.getByLabelText("Order") as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(select.options).toHaveLength(2);
  });

  it("should reflect the controlled value when descending", () => {
    // Arrange

    // Act
    render(<SortOrderSelect value="desc" onChange={vi.fn()} />);

    // Assert
    expect(screen.getByLabelText("Order")).toHaveValue("desc");
  });

  it("should call onChange with desc when the user selects Descending", async () => {
    // Arrange
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SortOrderSelect value="asc" onChange={onChange} />);

    // Act
    await user.selectOptions(screen.getByLabelText("Order"), "desc");

    // Assert
    expect(onChange).toHaveBeenCalledWith("desc");
  });

  it("should call onChange with asc when the user selects Ascending", async () => {
    // Arrange
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SortOrderSelect value="desc" onChange={onChange} />);

    // Act
    await user.selectOptions(screen.getByLabelText("Order"), "asc");

    // Assert
    expect(onChange).toHaveBeenCalledWith("asc");
  });
});
