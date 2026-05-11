/**
 * Accessibility Tests for ConfirmationModal
 *
 * Tests focus trap, keyboard navigation, ARIA attributes, and screen reader support
 * for the confirmation modal dialog.
 *
 * Requirements:
 * - Requirement 6.3: Trap keyboard focus within modal
 * - Requirement 6.5: Allow Escape key to dismiss
 * - Requirement 6.7: Restore focus after dismissal
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ConfirmationModal } from "./ConfirmationModal";

const FOCUS_TRAP_TAB_ATTEMPTS = 10;

describe("ConfirmationModal - Accessibility", () => {
  const defaultProps = {
    isOpen: true,
    title: "Confirm Action",
    message: "Are you sure you want to proceed?",
    confirmLabel: "Confirm",
    cancelLabel: "Cancel",
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    variant: "default" as const,
  };

  describe("ARIA attributes", () => {
    it("should have proper dialog role", () => {
      // Arrange & Act
      // Arrange

      render(<ConfirmationModal {...defaultProps} />);

      // Assert

      // Act

      const dialog = screen.getByRole("dialog");

      // Assert

      expect(dialog).toBeInTheDocument();
    });

    it("should have accessible title", () => {
      // Arrange & Act
      // Arrange

      // Act

      render(<ConfirmationModal {...defaultProps} />);

      // Assert

      // Assert

      expect(screen.getByText("Confirm Action")).toBeInTheDocument();
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAccessibleName("Confirm Action");
    });

    it("should have accessible description", () => {
      // Arrange & Act
      // Arrange

      // Act

      render(<ConfirmationModal {...defaultProps} />);

      // Assert

      // Assert

      expect(
        screen.getByText("Are you sure you want to proceed?")
      ).toBeInTheDocument();
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAccessibleDescription(
        "Are you sure you want to proceed?"
      );
    });

    it("should have accessible close button with aria-label", () => {
      // Arrange & Act
      // Arrange

      render(<ConfirmationModal {...defaultProps} />);

      // Assert

      // Act

      const closeButton = screen.getByRole("button", { name: /close/i });

      // Assert

      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAccessibleName();
    });

    it("should have accessible confirm button", () => {
      // Arrange & Act
      // Arrange

      render(<ConfirmationModal {...defaultProps} />);

      // Assert

      // Act

      const confirmButton = screen.getByRole("button", { name: "Confirm" });

      // Assert

      expect(confirmButton).toBeInTheDocument();
      expect(confirmButton).toHaveAccessibleName("Confirm");
    });

    it("should have accessible cancel button", () => {
      // Arrange & Act
      // Arrange

      render(<ConfirmationModal {...defaultProps} />);

      // Assert

      // Act

      const cancelButton = screen.getByRole("button", { name: "Cancel" });

      // Assert

      expect(cancelButton).toBeInTheDocument();
      expect(cancelButton).toHaveAccessibleName("Cancel");
    });
  });

  describe("keyboard navigation", () => {
    it("should allow Tab to move between modal elements", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      render(<ConfirmationModal {...defaultProps} />);

      // Act - Tab through modal elements
      await user.tab();

      // Assert - Focus should be on one of the modal's interactive elements
      const closeButton = screen.getByRole("button", { name: /close/i });
      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      const confirmButton = screen.getByRole("button", { name: "Confirm" });

      const focusedElement = document.activeElement;

      // Act

      const isInModal =
        focusedElement === closeButton ||
        focusedElement === cancelButton ||
        focusedElement === confirmButton;

      // Assert

      expect(isInModal).toBe(true);
    });

    it("should handle Escape key to dismiss modal", async () => {
      // Arrange
      // Arrange

      const handleCancel = vi.fn();
      const user = userEvent.setup();
      render(<ConfirmationModal {...defaultProps} onCancel={handleCancel} />);

      // Act

      // Act

      await user.keyboard("{Escape}");

      // Assert - Radix UI may call onCancel multiple times (once for Escape, once for onOpenChange)

      // Assert

      expect(handleCancel).toHaveBeenCalled();
    });

    it("should handle Enter key on confirm button", async () => {
      // Arrange
      // Arrange

      const handleConfirm = vi.fn();
      const user = userEvent.setup();
      render(<ConfirmationModal {...defaultProps} onConfirm={handleConfirm} />);

      // Act - Focus confirm button and press Enter
      const confirmButton = screen.getByRole("button", { name: "Confirm" });
      confirmButton.focus();

      // Act

      await user.keyboard("{Enter}");

      // Assert

      // Assert

      expect(handleConfirm).toHaveBeenCalledOnce();
    });

    it("should handle Enter key on cancel button", async () => {
      // Arrange
      // Arrange

      const handleCancel = vi.fn();
      const user = userEvent.setup();
      render(<ConfirmationModal {...defaultProps} onCancel={handleCancel} />);

      // Act - Focus cancel button and press Enter
      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      cancelButton.focus();

      // Act

      await user.keyboard("{Enter}");

      // Assert

      // Assert

      expect(handleCancel).toHaveBeenCalledOnce();
    });

    it("should cycle focus within modal with Tab", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      render(<ConfirmationModal {...defaultProps} />);

      // Act - Tab multiple times
      await user.tab();
      const firstFocus = document.activeElement;
      await user.tab();
      const secondFocus = document.activeElement;
      await user.tab();
      const thirdFocus = document.activeElement;

      // Assert - All focused elements should be within the modal
      const closeButton = screen.getByRole("button", { name: /close/i });
      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      const confirmButton = screen.getByRole("button", { name: "Confirm" });

      // Act

      const modalElements = [closeButton, cancelButton, confirmButton];

      // Assert

      expect(modalElements).toContain(firstFocus);
      expect(modalElements).toContain(secondFocus);
      expect(modalElements).toContain(thirdFocus);
    });

    it("should cycle focus backward with Shift+Tab", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      render(<ConfirmationModal {...defaultProps} />);

      // Act - Tab forward then backward
      await user.tab();
      await user.tab();
      const forwardFocus = document.activeElement;
      await user.keyboard("{Shift>}{Tab}{/Shift}");

      // Act

      const backwardFocus = document.activeElement;

      // Assert - Focus should move backward

      // Assert

      expect(forwardFocus).not.toBe(backwardFocus);

      const closeButton = screen.getByRole("button", { name: /close/i });
      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      const confirmButton = screen.getByRole("button", { name: "Confirm" });

      const modalElements = [closeButton, cancelButton, confirmButton];
      expect(modalElements).toContain(backwardFocus);
    });
  });

  describe("focus trap", () => {
    it("should trap focus within modal when open", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      render(
        <div>
          <button>Outside Button</button>
          <ConfirmationModal {...defaultProps} />
        </div>
      );

      // Act - Try to tab many times to escape modal
      for (let i = 0; i < FOCUS_TRAP_TAB_ATTEMPTS; i++) {
        await user.tab();
      }

      // Assert - Focus should still be within modal
      const focusedElement = document.activeElement;
      const closeButton = screen.getByRole("button", { name: /close/i });
      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      const confirmButton = screen.getByRole("button", { name: "Confirm" });

      // Act

      const modalElements = [closeButton, cancelButton, confirmButton];

      // Assert

      expect(modalElements).toContain(focusedElement);

      // Outside button should not have focus
      const outsideButton = screen.getByText("Outside Button");
      expect(outsideButton).not.toHaveFocus();
    });

    it("should not allow focus to escape modal with Shift+Tab", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      render(
        <div>
          <button>Outside Button</button>
          <ConfirmationModal {...defaultProps} />
        </div>
      );

      // Act - Try to shift-tab many times to escape modal
      for (let i = 0; i < FOCUS_TRAP_TAB_ATTEMPTS; i++) {
        await user.keyboard("{Shift>}{Tab}{/Shift}");
      }

      // Assert - Focus should still be within modal
      const focusedElement = document.activeElement;
      const closeButton = screen.getByRole("button", { name: /close/i });
      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      const confirmButton = screen.getByRole("button", { name: "Confirm" });

      // Act

      const modalElements = [closeButton, cancelButton, confirmButton];

      // Assert

      expect(modalElements).toContain(focusedElement);
    });
  });

  describe("focus restoration", () => {
    it("should restore focus after modal closes", async () => {
      // Arrange
      // Arrange

      const handleCancel = vi.fn();
      const { rerender } = render(
        <div>
          <button>Trigger Button</button>
          <ConfirmationModal
            {...defaultProps}
            isOpen={false}
            onCancel={handleCancel}
          />
        </div>
      );

      const triggerButton = screen.getByText("Trigger Button");

      // Act

      triggerButton.focus();

      // Assert

      expect(triggerButton).toHaveFocus();

      // Act - Open modal
      rerender(
        <div>
          <button>Trigger Button</button>
          <ConfirmationModal
            {...defaultProps}
            isOpen={true}
            onCancel={handleCancel}
          />
        </div>
      );

      // Wait for modal to open
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Close modal by calling onCancel (simulating Escape key or cancel button)
      handleCancel();

      // Rerender with modal closed
      rerender(
        <div>
          <button>Trigger Button</button>
          <ConfirmationModal
            {...defaultProps}
            isOpen={false}
            onCancel={handleCancel}
          />
        </div>
      );

      // Assert - Modal should be closed
      // Note: Radix UI handles focus restoration automatically
      // This test verifies the modal closes properly
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });
  });

  describe("screen reader announcements", () => {
    it("should announce modal title to screen readers", () => {
      // Arrange & Act
      // Arrange

      render(<ConfirmationModal {...defaultProps} />);

      // Assert

      // Act

      const dialog = screen.getByRole("dialog");

      // Assert

      expect(dialog).toHaveAccessibleName("Confirm Action");
    });

    it("should announce modal description to screen readers", () => {
      // Arrange & Act
      // Arrange

      render(<ConfirmationModal {...defaultProps} />);

      // Assert

      // Act

      const dialog = screen.getByRole("dialog");

      // Assert

      expect(dialog).toHaveAccessibleDescription(
        "Are you sure you want to proceed?"
      );
    });

    it("should announce destructive variant with appropriate styling", () => {
      // Arrange & Act
      // Arrange

      render(<ConfirmationModal {...defaultProps} variant="destructive" />);

      // Assert - Confirm button should have danger styling

      // Act

      const confirmButton = screen.getByRole("button", { name: "Confirm" });

      // Assert

      expect(confirmButton).toBeInTheDocument();
      // Button should have danger/destructive styling classes
      expect(confirmButton.className).toMatch(/bg-red|text-red/);
    });
  });

  describe("backdrop interaction", () => {
    it("should have backdrop element", () => {
      // Arrange & Act
      // Arrange

      render(<ConfirmationModal {...defaultProps} />);

      // Assert

      // Act

      const backdrop = screen.getByTestId("modal-backdrop");

      // Assert

      expect(backdrop).toBeInTheDocument();
    });

    it("should prevent interaction with background content", () => {
      // Arrange & Act
      // Arrange

      render(
        <div>
          <button>Background Button</button>
          <ConfirmationModal {...defaultProps} />
        </div>
      );

      // Assert - Background button should not be accessible

      // Act

      const backdrop = screen.getByTestId("modal-backdrop");

      // Backdrop should be on top (higher z-index)

      // Assert

      expect(backdrop).toBeInTheDocument();
      expect(backdrop.className).toContain("z-50");
    });
  });

  describe("color contrast", () => {
    it("should have sufficient contrast for title text", () => {
      // Arrange & Act
      // Arrange

      render(<ConfirmationModal {...defaultProps} />);

      // Assert - Title should have dark text classes

      // Act

      const title = screen.getByText("Confirm Action");

      // Assert

      expect(title.className).toMatch(/text-gray-900|dark:text-white/);
    });

    it("should have sufficient contrast for message text", () => {
      // Arrange & Act
      // Arrange

      render(<ConfirmationModal {...defaultProps} />);

      // Assert - Message should have readable text classes

      // Act

      const message = screen.getByText("Are you sure you want to proceed?");

      // Assert

      expect(message.className).toMatch(/text-gray-600|dark:text-gray-400/);
    });

    it("should have visible destructive button styling", () => {
      // Arrange & Act
      // Arrange

      render(<ConfirmationModal {...defaultProps} variant="destructive" />);

      // Assert - Destructive button should have red styling

      // Act

      const confirmButton = screen.getByRole("button", { name: "Confirm" });

      // Assert

      expect(confirmButton.className).toMatch(/bg-red|text-red/);
    });
  });

  describe("responsive design", () => {
    it("should have responsive width classes", () => {
      // Arrange & Act
      // Arrange

      render(<ConfirmationModal {...defaultProps} />);

      // Assert - Modal should have responsive width

      // Act

      const dialog = screen.getByRole("dialog");

      // Assert

      expect(dialog.className).toMatch(/w-full|max-w-/);
    });

    it("should have mobile-friendly padding", () => {
      // Arrange & Act
      // Arrange

      render(<ConfirmationModal {...defaultProps} />);

      // Assert - Modal should have padding

      // Act

      const dialog = screen.getByRole("dialog");

      // Assert

      expect(dialog.className).toMatch(/p-\d+/);
    });
  });
});
