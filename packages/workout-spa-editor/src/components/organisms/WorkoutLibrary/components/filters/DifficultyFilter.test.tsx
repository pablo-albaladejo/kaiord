/**
 * DifficultyFilter tests.
 *
 * Controlled <select> exposing four difficulty options (all / easy /
 * medium / hard). Verifies controlled-value rendering and onChange
 * forwarding for each option.
 */

import { describe, expect, it, vi } from "vitest";

import { render, screen, userEvent } from "../../../../../test-utils";
import { DifficultyFilter } from "./DifficultyFilter";

const EXPECTED_OPTION_COUNT = 4;

describe("DifficultyFilter", () => {
  it("should render the Difficulty label and a select with four options", () => {
    // Arrange

    // Act
    render(<DifficultyFilter value="all" onChange={vi.fn()} />);

    // Assert
    const select = screen.getByLabelText("Difficulty") as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(select.options).toHaveLength(EXPECTED_OPTION_COUNT);
  });

  it("should reflect the controlled value in the select", () => {
    // Arrange

    // Act
    render(<DifficultyFilter value="medium" onChange={vi.fn()} />);

    // Assert
    expect(screen.getByLabelText("Difficulty")).toHaveValue("medium");
  });

  it("should call onChange with the picked difficulty when the user selects easy", async () => {
    // Arrange
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DifficultyFilter value="all" onChange={onChange} />);

    // Act
    await user.selectOptions(screen.getByLabelText("Difficulty"), "easy");

    // Assert
    expect(onChange).toHaveBeenCalledWith("easy");
  });

  it("should call onChange with all when the user resets to All Levels", async () => {
    // Arrange
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DifficultyFilter value="hard" onChange={onChange} />);

    // Act
    await user.selectOptions(screen.getByLabelText("Difficulty"), "all");

    // Assert
    expect(onChange).toHaveBeenCalledWith("all");
  });
});
