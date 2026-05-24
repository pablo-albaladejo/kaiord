import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { BackButton } from "./BackButton";

describe("BackButton", () => {
  it('should render the ArrowLeft icon with aria-label "Back"', () => {
    // Arrange
    const onClick = vi.fn();

    // Act
    render(<BackButton onClick={onClick} />);

    // Assert
    const button = screen.getByRole("button", { name: "Back" });
    expect(button).toBeInTheDocument();
    expect(button.querySelector("svg")).not.toBeNull();
  });

  it("should fire onClick when clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<BackButton onClick={onClick} />);

    // Act
    await user.click(screen.getByRole("button", { name: "Back" }));

    // Assert
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("should use the provided testId attribute when supplied", () => {
    // Arrange
    const onClick = vi.fn();

    // Act
    render(<BackButton onClick={onClick} testId="custom-back" />);

    // Assert
    expect(screen.getByTestId("custom-back")).toBeInTheDocument();
  });

  it('should render with testid "back-button" when no testId prop is given', () => {
    // Arrange
    const onClick = vi.fn();

    // Act
    render(<BackButton onClick={onClick} />);

    // Assert
    expect(screen.getByTestId("back-button")).toBeInTheDocument();
  });
});
