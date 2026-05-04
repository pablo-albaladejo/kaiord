/**
 * PasteButton Component Tests
 *
 * Tests for the paste button component.
 * Requirement 39.2: Paste step from clipboard
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PasteButton } from "./PasteButton";

describe("PasteButton", () => {
  describe("rendering", () => {
    it("should render paste button with correct label", () => {
      // Arrange & Act
      // Arrange

      render(<PasteButton onPaste={vi.fn()} />);

      // Assert

      // Act

      const button = screen.getByRole("button", {
        name: "Paste step from clipboard",
      });

      // Assert

      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("Paste Step");
    });

    it("should render with custom className", () => {
      // Arrange & Act
      // Arrange

      render(<PasteButton onPaste={vi.fn()} className="custom-class" />);

      // Assert

      // Act

      const button = screen.getByRole("button");

      // Assert

      expect(button).toHaveClass("custom-class");
    });

    it("should have correct data-testid", () => {
      // Arrange & Act
      // Arrange

      // Act

      render(<PasteButton onPaste={vi.fn()} />);

      // Assert

      // Assert

      expect(screen.getByTestId("paste-step-button")).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("should call onPaste when clicked", async () => {
      // Arrange
      // Arrange

      const handlePaste = vi.fn();
      const user = userEvent.setup();
      render(<PasteButton onPaste={handlePaste} />);

      // Act

      // Act

      await user.click(screen.getByRole("button"));

      // Assert

      // Assert

      expect(handlePaste).toHaveBeenCalledOnce();
    });

    it("should stop event propagation when clicked", async () => {
      // Arrange
      // Arrange

      const handlePaste = vi.fn();
      const handleParentClick = vi.fn();
      const user = userEvent.setup();

      render(
        <div onClick={handleParentClick}>
          <PasteButton onPaste={handlePaste} />
        </div>
      );

      // Act

      // Act

      await user.click(screen.getByRole("button"));

      // Assert

      // Assert

      expect(handlePaste).toHaveBeenCalledOnce();
      expect(handleParentClick).not.toHaveBeenCalled();
    });
  });
});
