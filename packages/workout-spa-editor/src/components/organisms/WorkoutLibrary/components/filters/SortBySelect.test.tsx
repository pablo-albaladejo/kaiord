/* eslint-disable no-magic-numbers -- option counts are literal for clarity */

/**
 * SortBySelect tests.
 *
 * Controlled <select> for sort criteria (name / date / difficulty).
 * Verifies value reflection plus onChange forwarding for each option.
 */

import { describe, expect, it, vi } from "vitest";

import { render, screen, userEvent } from "../../../../../test-utils";
import { SortBySelect } from "./SortBySelect";

describe("SortBySelect", () => {
  it("should render the Sort By label and three options", () => {
    // Arrange

    // Act
    render(<SortBySelect value="name" onChange={vi.fn()} />);

    // Assert
    const select = screen.getByLabelText("Sort By") as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(select.options).toHaveLength(3);
  });

  it("should reflect the controlled value", () => {
    // Arrange

    // Act
    render(<SortBySelect value="date" onChange={vi.fn()} />);

    // Assert
    expect(screen.getByLabelText("Sort By")).toHaveValue("date");
  });

  it("should call onChange with date when the user selects Date Created", async () => {
    // Arrange
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SortBySelect value="name" onChange={onChange} />);

    // Act
    await user.selectOptions(screen.getByLabelText("Sort By"), "date");

    // Assert
    expect(onChange).toHaveBeenCalledWith("date");
  });

  it("should call onChange with difficulty when the user selects Difficulty", async () => {
    // Arrange
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SortBySelect value="name" onChange={onChange} />);

    // Act
    await user.selectOptions(screen.getByLabelText("Sort By"), "difficulty");

    // Assert
    expect(onChange).toHaveBeenCalledWith("difficulty");
  });
});
