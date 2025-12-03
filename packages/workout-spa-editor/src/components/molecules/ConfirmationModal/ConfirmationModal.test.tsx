/**
 * ConfirmationModal Unit Tests
 *
 * Tests modal rendering with different props, backdrop click dismissal,
 * and button click handlers.
 *
 * Requirements:
 * - Requirement 6.2: Modal displays with dim background
 * - Requirement 6.4: Modal has confirmation and cancel actions
 * - Requirement 6.8: Destructive actions use warning colors
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmationModal } from "./ConfirmationModal";

describe("ConfirmationModal", () => {
  describe("rendering", () => {
    it("should not render when isOpen is false", () => {
      // Arrange & Act
      render(
        <ConfirmationModal
          isOpen={false}
          title="Test Title"
          message="Test message"
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          variant="default"
        />
      );

      // Assert
      expect(screen.queryByText("Test Title")).not.toBeInTheDocument();
    });

    it("should render when isOpen is true", () => {
      // Arrange & Act
      render(
        <ConfirmationModal
          isOpen={true}
          title="Test Title"
          message="Test message"
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          variant="default"
        />
      );

      // Assert
      expect(screen.getByText("Test Title")).toBeInTheDocument();
      expect(screen.getByText("Test message")).toBeInTheDocument();
    });

    it("should render confirm and cancel buttons with correct labels", () => {
      // Arrange & Act
      render(
        <ConfirmationModal
          isOpen={true}
          title="Test Title"
          message="Test message"
          confirmLabel="Delete"
          cancelLabel="Keep"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          variant="default"
        />
      );

      // Assert
      expect(
        screen.getByRole("button", { name: "Delete" })
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Keep" })).toBeInTheDocument();
    });

    it("should use danger variant for destructive actions", () => {
      // Arrange & Act
      render(
        <ConfirmationModal
          isOpen={true}
          title="Delete Item"
          message="Are you sure?"
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          variant="destructive"
        />
      );

      // Assert
      const confirmButton = screen.getByRole("button", { name: "Delete" });
      expect(confirmButton).toHaveClass("bg-red-600");
    });

    it("should use primary variant for default actions", () => {
      // Arrange & Act
      render(
        <ConfirmationModal
          isOpen={true}
          title="Confirm Action"
          message="Are you sure?"
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          variant="default"
        />
      );

      // Assert
      const confirmButton = screen.getByRole("button", { name: "Confirm" });
      expect(confirmButton).toHaveClass("bg-primary-600");
    });
  });

  describe("interactions", () => {
    it("should call onConfirm when confirm button is clicked", async () => {
      // Arrange
      const handleConfirm = vi.fn();
      const user = userEvent.setup();
      render(
        <ConfirmationModal
          isOpen={true}
          title="Test Title"
          message="Test message"
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          onConfirm={handleConfirm}
          onCancel={vi.fn()}
          variant="default"
        />
      );

      // Act
      await user.click(screen.getByRole("button", { name: "Confirm" }));

      // Assert
      expect(handleConfirm).toHaveBeenCalledOnce();
    });

    it("should call onCancel when cancel button is clicked", async () => {
      // Arrange
      const handleCancel = vi.fn();
      const user = userEvent.setup();
      render(
        <ConfirmationModal
          isOpen={true}
          title="Test Title"
          message="Test message"
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          onConfirm={vi.fn()}
          onCancel={handleCancel}
          variant="default"
        />
      );

      // Act
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      // Assert
      expect(handleCancel).toHaveBeenCalledOnce();
    });

    it("should call onCancel when close button is clicked", async () => {
      // Arrange
      const handleCancel = vi.fn();
      const user = userEvent.setup();
      render(
        <ConfirmationModal
          isOpen={true}
          title="Test Title"
          message="Test message"
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          onConfirm={vi.fn()}
          onCancel={handleCancel}
          variant="default"
        />
      );

      // Act
      const closeButton = screen.getByRole("button", { name: "Close" });
      await user.click(closeButton);

      // Assert
      expect(handleCancel).toHaveBeenCalledOnce();
    });
  });

  describe("backdrop", () => {
    it("should render backdrop with dim effect", () => {
      // Arrange & Act
      const { container } = render(
        <ConfirmationModal
          isOpen={true}
          title="Test Title"
          message="Test message"
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          variant="default"
        />
      );

      // Assert
      const backdrop = document.querySelector('[data-testid="modal-backdrop"]');
      expect(backdrop).toBeInTheDocument();
      expect(backdrop).toHaveClass("bg-black/50");
    });
  });
});
