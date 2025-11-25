/**
 * CreateRepetitionBlockDialog Component Tests
 *
 * Tests for the create repetition block dialog component.
 * Requirement 7.1.5: Validate minimum repeat count of 2
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CreateRepetitionBlockDialog } from "./CreateRepetitionBlockDialog";

describe("CreateRepetitionBlockDialog", () => {
  describe("rendering", () => {
    it("should render dialog with default repeat count of 2", () => {
      // Arrange & Act
      render(
        <CreateRepetitionBlockDialog
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          isOpen={true}
        />
      );

      // Assert
      const input = screen.getByRole("spinbutton", { name: /repeat count/i });
      expect(input).toHaveValue(2);
    });

    it("should render dialog with step count", () => {
      // Arrange & Act
      render(
        <CreateRepetitionBlockDialog
          isOpen={true}
          stepCount={3}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          isOpen={true}
        />
      );

      // Assert
      expect(screen.getByText(/3 steps/i)).toBeInTheDocument();
    });

    it("should render dialog without step count", () => {
      // Arrange & Act
      render(
        <CreateRepetitionBlockDialog
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          isOpen={true}
        />
      );

      // Assert
      const input = screen.getByRole("spinbutton");
      expect(input).toBeInTheDocument();
    });

    it("should render cancel button", () => {
      // Arrange & Act
      render(
        <CreateRepetitionBlockDialog
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          isOpen={true}
        />
      );

      // Assert
      expect(
        screen.getByRole("button", { name: /cancel/i })
      ).toBeInTheDocument();
    });

    it("should render confirm button", () => {
      // Arrange & Act
      render(
        <CreateRepetitionBlockDialog
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          isOpen={true}
        />
      );

      // Assert
      expect(
        screen.getByRole("button", { name: /create/i })
      ).toBeInTheDocument();
    });
  });

  describe("validation", () => {
    it("should show error when repeat count is less than 2", async () => {
      // Arrange
      const handleConfirm = vi.fn();
      const user = userEvent.setup();
      render(
        <CreateRepetitionBlockDialog
          isOpen={true}
          onConfirm={handleConfirm}
          isOpen={true}
          onCancel={vi.fn()}
          isOpen={true}
        />
      );

      // Act
      const input = screen.getByRole("spinbutton");
      await user.clear(input);
      await user.type(input, "1");
      await user.click(screen.getByRole("button", { name: /create/i }));

      // Assert
      expect(
        screen.getByText("Repeat count must be at least 2")
      ).toBeInTheDocument();
      expect(handleConfirm).not.toHaveBeenCalled();
    });

    it("should show error when repeat count is 0", async () => {
      // Arrange
      const handleConfirm = vi.fn();
      const user = userEvent.setup();
      render(
        <CreateRepetitionBlockDialog
          isOpen={true}
          onConfirm={handleConfirm}
          isOpen={true}
          onCancel={vi.fn()}
          isOpen={true}
        />
      );

      // Act
      const input = screen.getByRole("spinbutton");
      await user.clear(input);
      await user.type(input, "0");
      await user.click(screen.getByRole("button", { name: /create/i }));

      // Assert
      expect(
        screen.getByText("Repeat count must be at least 2")
      ).toBeInTheDocument();
      expect(handleConfirm).not.toHaveBeenCalled();
    });

    it("should show error when repeat count is negative", async () => {
      // Arrange
      const handleConfirm = vi.fn();
      const user = userEvent.setup();
      render(
        <CreateRepetitionBlockDialog
          isOpen={true}
          onConfirm={handleConfirm}
          isOpen={true}
          onCancel={vi.fn()}
          isOpen={true}
        />
      );

      // Act
      const input = screen.getByRole("spinbutton");
      await user.clear(input);
      await user.type(input, "-5");
      await user.click(screen.getByRole("button", { name: /create/i }));

      // Assert
      expect(
        screen.getByText("Repeat count must be at least 2")
      ).toBeInTheDocument();
      expect(handleConfirm).not.toHaveBeenCalled();
    });

    it("should show error when repeat count is not a number", async () => {
      // Arrange
      const handleConfirm = vi.fn();
      const user = userEvent.setup();
      render(
        <CreateRepetitionBlockDialog
          isOpen={true}
          onConfirm={handleConfirm}
          isOpen={true}
          onCancel={vi.fn()}
          isOpen={true}
        />
      );

      // Act
      const input = screen.getByRole("spinbutton");
      await user.clear(input);
      await user.type(input, "abc");
      await user.click(screen.getByRole("button", { name: /create/i }));

      // Assert
      expect(
        screen.getByText("Repeat count must be at least 2")
      ).toBeInTheDocument();
      expect(handleConfirm).not.toHaveBeenCalled();
    });

    it("should accept repeat count of 2", async () => {
      // Arrange
      const handleConfirm = vi.fn();
      const user = userEvent.setup();
      render(
        <CreateRepetitionBlockDialog
          isOpen={true}
          onConfirm={handleConfirm}
          isOpen={true}
          onCancel={vi.fn()}
          isOpen={true}
        />
      );

      // Act
      const input = screen.getByRole("spinbutton");
      await user.clear(input);
      await user.type(input, "2");
      await user.click(screen.getByRole("button", { name: /create/i }));

      // Assert
      expect(handleConfirm).toHaveBeenCalledWith(2);
    });

    it("should accept repeat count greater than 2", async () => {
      // Arrange
      const handleConfirm = vi.fn();
      const user = userEvent.setup();
      render(
        <CreateRepetitionBlockDialog
          isOpen={true}
          onConfirm={handleConfirm}
          isOpen={true}
          onCancel={vi.fn()}
          isOpen={true}
        />
      );

      // Act
      const input = screen.getByRole("spinbutton");
      await user.clear(input);
      await user.type(input, "5");
      await user.click(screen.getByRole("button", { name: /create/i }));

      // Assert
      expect(handleConfirm).toHaveBeenCalledWith(5);
    });

    it("should clear error when user types valid value", async () => {
      // Arrange
      const handleConfirm = vi.fn();
      const user = userEvent.setup();
      render(
        <CreateRepetitionBlockDialog
          isOpen={true}
          onConfirm={handleConfirm}
          isOpen={true}
          onCancel={vi.fn()}
          isOpen={true}
        />
      );

      // Act - First trigger error
      const input = screen.getByRole("spinbutton");
      await user.clear(input);
      await user.type(input, "1");
      await user.click(screen.getByRole("button", { name: /create/i }));

      // Verify error is shown
      expect(
        screen.getByText("Repeat count must be at least 2")
      ).toBeInTheDocument();

      // Act - Type valid value
      await user.clear(input);
      await user.type(input, "3");

      // Assert - Error should be cleared
      expect(
        screen.queryByText("Repeat count must be at least 2")
      ).not.toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("should call onConfirm with repeat count when confirmed", async () => {
      // Arrange
      const handleConfirm = vi.fn();
      const user = userEvent.setup();
      render(
        <CreateRepetitionBlockDialog
          isOpen={true}
          onConfirm={handleConfirm}
          isOpen={true}
          onCancel={vi.fn()}
          isOpen={true}
        />
      );

      // Act
      const input = screen.getByRole("spinbutton");
      await user.clear(input);
      await user.type(input, "3");
      await user.click(screen.getByRole("button", { name: /create/i }));

      // Assert
      expect(handleConfirm).toHaveBeenCalledWith(3);
      expect(handleConfirm).toHaveBeenCalledOnce();
    });

    it("should call onCancel when cancel button clicked", async () => {
      // Arrange
      const handleCancel = vi.fn();
      const user = userEvent.setup();
      render(
        <CreateRepetitionBlockDialog
          isOpen={true}
          onConfirm={vi.fn()}
          onCancel={handleCancel}
          isOpen={true}
        />
      );

      // Act
      await user.click(screen.getByRole("button", { name: /cancel/i }));

      // Assert
      expect(handleCancel).toHaveBeenCalledOnce();
    });

    it("should call onCancel when X button clicked", async () => {
      // Arrange
      const handleCancel = vi.fn();
      const user = userEvent.setup();
      render(
        <CreateRepetitionBlockDialog
          isOpen={true}
          onConfirm={vi.fn()}
          onCancel={handleCancel}
          isOpen={true}
        />
      );

      // Act
      const closeButton = screen.getByRole("button", { name: /close/i });
      await user.click(closeButton);

      // Assert
      expect(handleCancel).toHaveBeenCalledOnce();
    });

    it("should allow changing repeat count", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <CreateRepetitionBlockDialog
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          isOpen={true}
        />
      );

      // Act
      const input = screen.getByRole("spinbutton");
      await user.clear(input);
      await user.type(input, "10");

      // Assert
      expect(input).toHaveValue(10);
    });
  });

  describe("keyboard shortcuts", () => {
    it("should call onConfirm when Enter is pressed in input", async () => {
      // Arrange
      const handleConfirm = vi.fn();
      const user = userEvent.setup();
      render(
        <CreateRepetitionBlockDialog
          isOpen={true}
          onConfirm={handleConfirm}
          isOpen={true}
          onCancel={vi.fn()}
          isOpen={true}
        />
      );

      // Act
      const input = screen.getByRole("spinbutton");
      await user.clear(input);
      await user.type(input, "3");
      await user.keyboard("{Enter}");

      // Assert
      expect(handleConfirm).toHaveBeenCalledWith(3);
    });

    it("should call onCancel when Escape is pressed in input", async () => {
      // Arrange
      const handleCancel = vi.fn();
      const user = userEvent.setup();
      render(
        <CreateRepetitionBlockDialog
          isOpen={true}
          onConfirm={vi.fn()}
          onCancel={handleCancel}
          isOpen={true}
        />
      );

      // Act
      const input = screen.getByRole("spinbutton");
      input.focus();
      await user.keyboard("{Escape}");

      // Assert
      expect(handleCancel).toHaveBeenCalledOnce();
    });

    it("should not call onConfirm when Enter is pressed with invalid value", async () => {
      // Arrange
      const handleConfirm = vi.fn();
      const user = userEvent.setup();
      render(
        <CreateRepetitionBlockDialog
          isOpen={true}
          onConfirm={handleConfirm}
          isOpen={true}
          onCancel={vi.fn()}
          isOpen={true}
        />
      );

      // Act
      const input = screen.getByRole("spinbutton");
      await user.clear(input);
      await user.type(input, "1");
      await user.keyboard("{Enter}");

      // Assert
      expect(handleConfirm).not.toHaveBeenCalled();
      expect(
        screen.getByText("Repeat count must be at least 2")
      ).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have proper dialog structure", () => {
      // Arrange & Act
      render(
        <CreateRepetitionBlockDialog
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          isOpen={true}
        />
      );

      // Assert
      expect(screen.getByRole("spinbutton")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /cancel/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /create/i })
      ).toBeInTheDocument();
    });

    it("should have accessible input label", () => {
      // Arrange & Act
      render(
        <CreateRepetitionBlockDialog
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          isOpen={true}
        />
      );

      // Assert
      const input = screen.getByRole("spinbutton", { name: /repeat count/i });
      expect(input).toBeInTheDocument();
    });

    it("should display error message accessibly", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <CreateRepetitionBlockDialog
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          isOpen={true}
        />
      );

      // Act
      const input = screen.getByRole("spinbutton");
      await user.clear(input);
      await user.type(input, "1");
      await user.click(screen.getByRole("button", { name: /create/i }));

      // Assert
      const errorMessage = screen.getByText("Repeat count must be at least 2");
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveClass("text-red-600");
    });
  });
});
