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
      render(<PasteButton onPaste={vi.fn()} />);

      // Assert
      const button = screen.getByRole("button", {
        name: "Paste step from clipboard",
      });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("Paste Step");
    });

    it("should render with custom className", () => {
      // Arrange & Act
      render(<PasteButton onPaste={vi.fn()} className="custom-class" />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass("custom-class");
    });

    it("should have correct data-testid", () => {
      // Arrange & Act
      render(<PasteButton onPaste={vi.fn()} />);

      // Assert
      expect(screen.getByTestId("paste-step-button")).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("should call onPaste when clicked", async () => {
      // Arrange
      const handlePaste = vi.fn();
      const user = userEvent.setup();
      render(<PasteButton onPaste={handlePaste} />);

      // Act
      await user.click(screen.getByRole("button"));

      // Assert
      expect(handlePaste).toHaveBeenCalledOnce();
    });

    it("should stop event propagation when clicked", async () => {
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
      await user.click(screen.getByRole("button"));

      // Assert
      expect(handlePaste).toHaveBeenCalledOnce();
      expect(handleParentClick).not.toHaveBeenCalled();
    });
  });
});
