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

const FIVE_REPEATS = 5;

const THREE_REPEATS = 3;

const TEN_REPEATS = 10;

describe("CreateRepetitionBlockDialog", () => {
  describe("rendering", () => {
    it("should render dialog with default repeat count of 2", () => {
      // Arrange & Act
      // Arrange

      render(
        <CreateRepetitionBlockDialog
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          isOpen={true}
        />
      );

      // Assert

      // Act

      const input = screen.getByRole("spinbutton", { name: /repeat count/i });

      // Assert

      expect(input).toHaveValue(2);
    });

    it("should render dialog with step count", () => {
      // Arrange & Act
      // Arrange

      // Act

      render(
        <CreateRepetitionBlockDialog
          isOpen={true}
          stepCount={3}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      // Assert

      // Assert

      expect(screen.getByText(/3 steps/i)).toBeInTheDocument();
    });

    it("should render dialog without step count", () => {
      // Arrange & Act
      // Arrange

      render(
        <CreateRepetitionBlockDialog
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          isOpen={true}
        />
      );

      // Assert

      // Act

      const input = screen.getByRole("spinbutton");

      // Assert

      expect(input).toBeInTheDocument();
    });

    it("should render cancel button", () => {
      // Arrange & Act
      // Arrange

      // Act

      render(
        <CreateRepetitionBlockDialog
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          isOpen={true}
        />
      );

      // Assert

      // Assert

      expect(
        screen.getByRole("button", { name: /cancel/i })
      ).toBeInTheDocument();
    });

    it("should render confirm button", () => {
      // Arrange & Act
      // Arrange

      // Act

      render(
        <CreateRepetitionBlockDialog
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          isOpen={true}
        />
      );

      // Assert

      // Assert

      expect(
        screen.getByRole("button", { name: /create/i })
      ).toBeInTheDocument();
    });
  });

  describe("validation", () => {
    it("should show error when repeat count is less than 2", async () => {
      // Arrange
      // Arrange

      const handleConfirm = vi.fn();
      const user = userEvent.setup();
      render(
        <CreateRepetitionBlockDialog
          isOpen={true}
          onConfirm={handleConfirm}
          onCancel={vi.fn()}
        />
      );

      // Act
      const input = screen.getByRole("spinbutton");
      await user.clear(input);
      await user.type(input, "1");

      // Act

      await user.click(screen.getByRole("button", { name: /create/i }));

      // Assert

      // Assert

      expect(
        screen.getByText("Repeat count must be at least 2")
      ).toBeInTheDocument();
      expect(handleConfirm).not.toHaveBeenCalled();
    });

    it("should show error when repeat count is 0", async () => {
      // Arrange
      // Arrange

      const handleConfirm = vi.fn();
      const user = userEvent.setup();
      render(
        <CreateRepetitionBlockDialog
          isOpen={true}
          onConfirm={handleConfirm}
          onCancel={vi.fn()}
        />
      );

      // Act
      const input = screen.getByRole("spinbutton");
      await user.clear(input);
      await user.type(input, "0");

      // Act

      await user.click(screen.getByRole("button", { name: /create/i }));

      // Assert

      // Assert

      expect(
        screen.getByText("Repeat count must be at least 2")
      ).toBeInTheDocument();
      expect(handleConfirm).not.toHaveBeenCalled();
    });

    it("should show error when repeat count is negative", async () => {
      // Arrange
      // Arrange

      const handleConfirm = vi.fn();
      const user = userEvent.setup();
      render(
        <CreateRepetitionBlockDialog
          isOpen={true}
          onConfirm={handleConfirm}
          onCancel={vi.fn()}
        />
      );

      // Act
      const input = screen.getByRole("spinbutton");
      await user.clear(input);
      await user.type(input, "-5");

      // Act

      await user.click(screen.getByRole("button", { name: /create/i }));

      // Assert

      // Assert

      expect(
        screen.getByText("Repeat count must be at least 2")
      ).toBeInTheDocument();
      expect(handleConfirm).not.toHaveBeenCalled();
    });

    it("should show error when repeat count is not a number", async () => {
      // Arrange
      // Arrange

      const handleConfirm = vi.fn();
      const user = userEvent.setup();
      render(
        <CreateRepetitionBlockDialog
          isOpen={true}
          onConfirm={handleConfirm}
          onCancel={vi.fn()}
        />
      );

      // Act
      const input = screen.getByRole("spinbutton");
      await user.clear(input);
      await user.type(input, "abc");

      // Act

      await user.click(screen.getByRole("button", { name: /create/i }));

      // Assert

      // Assert

      expect(
        screen.getByText("Repeat count must be at least 2")
      ).toBeInTheDocument();
      expect(handleConfirm).not.toHaveBeenCalled();
    });

    it("should accept repeat count of 2", async () => {
      // Arrange
      // Arrange

      const handleConfirm = vi.fn();
      const user = userEvent.setup();
      render(
        <CreateRepetitionBlockDialog
          isOpen={true}
          onConfirm={handleConfirm}
          onCancel={vi.fn()}
        />
      );

      // Act
      const input = screen.getByRole("spinbutton");
      await user.clear(input);
      await user.type(input, "2");

      // Act

      await user.click(screen.getByRole("button", { name: /create/i }));

      // Assert

      // Assert

      expect(handleConfirm).toHaveBeenCalledWith(2);
    });

    it("should accept repeat count greater than 2", async () => {
      // Arrange
      // Arrange

      const handleConfirm = vi.fn();
      const user = userEvent.setup();
      render(
        <CreateRepetitionBlockDialog
          isOpen={true}
          onConfirm={handleConfirm}
          onCancel={vi.fn()}
        />
      );

      // Act
      const input = screen.getByRole("spinbutton");
      await user.clear(input);
      await user.type(input, "5");

      // Act

      await user.click(screen.getByRole("button", { name: /create/i }));

      // Assert

      // Assert

      expect(handleConfirm).toHaveBeenCalledWith(FIVE_REPEATS);
    });

    it("should clear error when user types valid value", async () => {
      // Arrange
      // Arrange

      const handleConfirm = vi.fn();
      const user = userEvent.setup();
      render(
        <CreateRepetitionBlockDialog
          isOpen={true}
          onConfirm={handleConfirm}
          onCancel={vi.fn()}
        />
      );

      // Act - First trigger error
      const input = screen.getByRole("spinbutton");
      await user.clear(input);
      await user.type(input, "1");

      // Act

      await user.click(screen.getByRole("button", { name: /create/i }));

      // Verify error is shown

      // Assert

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
      // Arrange

      const handleConfirm = vi.fn();
      const user = userEvent.setup();
      render(
        <CreateRepetitionBlockDialog
          isOpen={true}
          onConfirm={handleConfirm}
          onCancel={vi.fn()}
        />
      );

      // Act
      const input = screen.getByRole("spinbutton");
      await user.clear(input);
      await user.type(input, "3");

      // Act

      await user.click(screen.getByRole("button", { name: /create/i }));

      // Assert

      // Assert

      expect(handleConfirm).toHaveBeenCalledWith(THREE_REPEATS);
      expect(handleConfirm).toHaveBeenCalledOnce();
    });

    it("should call onCancel when cancel button clicked", async () => {
      // Arrange
      // Arrange

      const handleCancel = vi.fn();
      const user = userEvent.setup();
      render(
        <CreateRepetitionBlockDialog
          isOpen={true}
          onConfirm={vi.fn()}
          onCancel={handleCancel}
        />
      );

      // Act

      // Act

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      // Assert

      // Assert

      expect(handleCancel).toHaveBeenCalledOnce();
    });

    it("should call onCancel when X button clicked", async () => {
      // Arrange
      // Arrange

      const handleCancel = vi.fn();
      const user = userEvent.setup();
      render(
        <CreateRepetitionBlockDialog
          isOpen={true}
          onConfirm={vi.fn()}
          onCancel={handleCancel}
        />
      );

      // Act
      const closeButton = screen.getByRole("button", { name: /close/i });

      // Act

      await user.click(closeButton);

      // Assert

      // Assert

      expect(handleCancel).toHaveBeenCalledOnce();
    });

    it("should allow changing repeat count", async () => {
      // Arrange
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

      // Act

      await user.type(input, "10");

      // Assert

      // Assert

      expect(input).toHaveValue(TEN_REPEATS);
    });
  });

  describe("keyboard shortcuts", () => {
    it("should call onConfirm when Enter is pressed in input", async () => {
      // Arrange
      // Arrange

      const handleConfirm = vi.fn();
      const user = userEvent.setup();
      render(
        <CreateRepetitionBlockDialog
          isOpen={true}
          onConfirm={handleConfirm}
          onCancel={vi.fn()}
        />
      );

      // Act
      const input = screen.getByRole("spinbutton");
      await user.clear(input);
      await user.type(input, "3");

      // Act

      await user.keyboard("{Enter}");

      // Assert

      // Assert

      expect(handleConfirm).toHaveBeenCalledWith(THREE_REPEATS);
    });

    it("should call onCancel when Escape is pressed in input", async () => {
      // Arrange
      // Arrange

      const handleCancel = vi.fn();
      const user = userEvent.setup();
      render(
        <CreateRepetitionBlockDialog
          isOpen={true}
          onConfirm={vi.fn()}
          onCancel={handleCancel}
        />
      );

      // Act
      const input = screen.getByRole("spinbutton");
      input.focus();

      // Act

      await user.keyboard("{Escape}");

      // Assert

      // Assert

      expect(handleCancel).toHaveBeenCalledOnce();
    });

    it("should not call onConfirm when Enter is pressed with invalid value", async () => {
      // Arrange
      // Arrange

      const handleConfirm = vi.fn();
      const user = userEvent.setup();
      render(
        <CreateRepetitionBlockDialog
          isOpen={true}
          onConfirm={handleConfirm}
          onCancel={vi.fn()}
        />
      );

      // Act
      const input = screen.getByRole("spinbutton");
      await user.clear(input);
      await user.type(input, "1");

      // Act

      await user.keyboard("{Enter}");

      // Assert

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
      // Arrange

      // Act

      render(
        <CreateRepetitionBlockDialog
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          isOpen={true}
        />
      );

      // Assert

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
      // Arrange

      render(
        <CreateRepetitionBlockDialog
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          isOpen={true}
        />
      );

      // Assert

      // Act

      const input = screen.getByRole("spinbutton", { name: /repeat count/i });

      // Assert

      expect(input).toBeInTheDocument();
    });

    it("should display error message accessibly", async () => {
      // Arrange
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

      // Act

      const errorMessage = screen.getByText("Repeat count must be at least 2");

      // Assert

      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveClass("text-red-600");
    });
  });
});
