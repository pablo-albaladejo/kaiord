/**
 * SearchInput tests.
 *
 * Thin wrapper around the Input atom: forwards `value` and emits the
 * raw next string via `onChange` (event.target.value is unwrapped).
 */

import { describe, expect, it, vi } from "vitest";

import { render, screen, userEvent } from "../../../../../test-utils";
import { SearchInput } from "./SearchInput";

describe("SearchInput", () => {
  it("should render with the search placeholder", () => {
    // Arrange

    // Act
    render(<SearchInput value="" onChange={vi.fn()} />);

    // Assert
    expect(
      screen.getByPlaceholderText("Search workouts...")
    ).toBeInTheDocument();
  });

  it("should reflect the controlled value", () => {
    // Arrange

    // Act
    render(<SearchInput value="climb" onChange={vi.fn()} />);

    // Assert
    expect(screen.getByPlaceholderText("Search workouts...")).toHaveValue(
      "climb"
    );
  });

  it("should call onChange with the unwrapped next string per keystroke", async () => {
    // Arrange
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchInput value="" onChange={onChange} />);

    // Act
    await user.type(screen.getByPlaceholderText("Search workouts..."), "ab");

    // Assert
    expect(onChange).toHaveBeenNthCalledWith(1, "a");
    expect(onChange).toHaveBeenNthCalledWith(2, "b");
  });
});
