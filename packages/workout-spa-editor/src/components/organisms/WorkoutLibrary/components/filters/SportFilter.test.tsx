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

const EXPECTED_OPTION_COUNT = 5;
const FIRST_CALL = 1;
const SECOND_CALL = 2;
const THIRD_CALL = 3;

describe("SportFilter", () => {
  it("should render the Sport label and five options", () => {
    // Arrange

    // Act
    render(<SportFilter value="all" onChange={vi.fn()} />);

    // Assert
    const select = screen.getByLabelText("Sport") as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(select.options).toHaveLength(EXPECTED_OPTION_COUNT);
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
    expect(onChange).toHaveBeenNthCalledWith(FIRST_CALL, "running");
    expect(onChange).toHaveBeenNthCalledWith(SECOND_CALL, "swimming");
    expect(onChange).toHaveBeenNthCalledWith(THIRD_CALL, "generic");
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
