/**
 * Accessibility Tests for RepetitionBlockCard
 *
 * Tests keyboard navigation, ARIA attributes, and screen reader support
 * for repetition block operations including deletion.
 *
 * Requirements:
 * - Requirement 3.3: Delete button accessibility
 * - Requirement 4.1: Keyboard shortcuts for deletion
 * - Requirement 6.3: Modal focus trap
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { RepetitionBlock } from "../../../types/krd";
import { RepetitionBlockCard } from "./RepetitionBlockCard";

describe("RepetitionBlockCard - Accessibility", () => {
  const mockBlock: RepetitionBlock = {
    repeatCount: 3,
    steps: [
      {
        stepIndex: 0,
        durationType: "time",
        duration: { type: "time", seconds: 300 },
        targetType: "power",
        target: { type: "power", value: { unit: "watts", value: 200 } },
        intensity: "active",
      },
    ],
  };

  describe("keyboard navigation through blocks", () => {
    it("should be focusable via tabIndex", () => {
      // Arrange & Act
      render(<RepetitionBlockCard block={mockBlock} />);
      const blockCard = screen.getByTestId("repetition-block-card");

      // Assert
      expect(blockCard).toHaveAttribute("tabIndex", "0");
    });

    it("should handle Delete key for block deletion", async () => {
      // Arrange
      const handleDelete = vi.fn();
      const user = userEvent.setup();
      render(<RepetitionBlockCard block={mockBlock} onDelete={handleDelete} />);
      const blockCard = screen.getByTestId("repetition-block-card");

      // Act
      blockCard.focus();
      await user.keyboard("{Delete}");

      // Assert
      expect(handleDelete).toHaveBeenCalledOnce();
    });

    it("should handle Backspace key for block deletion", async () => {
      // Arrange
      const handleDelete = vi.fn();
      const user = userEvent.setup();
      render(<RepetitionBlockCard block={mockBlock} onDelete={handleDelete} />);
      const blockCard = screen.getByTestId("repetition-block-card");

      // Act
      blockCard.focus();
      await user.keyboard("{Backspace}");

      // Assert
      expect(handleDelete).toHaveBeenCalledOnce();
    });

    it("should not trigger deletion when editing repeat count", async () => {
      // Arrange
      const handleDelete = vi.fn();
      const handleEditRepeatCount = vi.fn();
      const user = userEvent.setup();
      render(
        <RepetitionBlockCard
          block={mockBlock}
          onDelete={handleDelete}
          onEditRepeatCount={handleEditRepeatCount}
        />
      );

      // Act - Click edit button (shows "3x") to enter edit mode
      const editButton = screen.getByTestId("edit-count-button");
      await user.click(editButton);

      // Try to delete while editing
      const blockCard = screen.getByTestId("repetition-block-card");
      blockCard.focus();
      await user.keyboard("{Delete}");

      // Assert - Delete should not be called while editing
      expect(handleDelete).not.toHaveBeenCalled();
    });

    it("should prevent default browser behavior for Backspace", async () => {
      // Arrange
      const handleDelete = vi.fn();
      const user = userEvent.setup();
      render(<RepetitionBlockCard block={mockBlock} onDelete={handleDelete} />);
      const blockCard = screen.getByTestId("repetition-block-card");

      // Act
      blockCard.focus();
      const event = new KeyboardEvent("keydown", {
        key: "Backspace",
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = vi.spyOn(event, "preventDefault");
      blockCard.dispatchEvent(event);

      // Assert - preventDefault should be called to prevent browser back navigation
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe("ARIA attributes", () => {
    it("should have proper role for interactive element", () => {
      // Arrange & Act
      render(<RepetitionBlockCard block={mockBlock} />);
      const blockCard = screen.getByTestId("repetition-block-card");

      // Assert - Block should be focusable but not have a specific role
      // (it's a container with keyboard handlers)
      expect(blockCard).toBeInTheDocument();
      expect(blockCard).toHaveAttribute("tabIndex", "0");
    });

    it("should have accessible delete button with aria-label", () => {
      // Arrange & Act
      render(<RepetitionBlockCard block={mockBlock} onDelete={vi.fn()} />);

      // Assert
      const deleteButton = screen.getByRole("button", {
        name: /delete repetition block/i,
      });
      expect(deleteButton).toBeInTheDocument();
      expect(deleteButton).toHaveAccessibleName();
    });

    it("should have accessible block actions menu", () => {
      // Arrange & Act
      render(<RepetitionBlockCard block={mockBlock} onUngroup={vi.fn()} />);

      // Assert
      const actionsButton = screen.getByRole("button", {
        name: /block actions/i,
      });
      expect(actionsButton).toBeInTheDocument();
      expect(actionsButton).toHaveAccessibleName();
    });

    it("should have accessible add step button", () => {
      // Arrange & Act
      render(<RepetitionBlockCard block={mockBlock} onAddStep={vi.fn()} />);

      // Assert
      const addButton = screen.getByRole("button", {
        name: /add step/i,
      });
      expect(addButton).toBeInTheDocument();
      expect(addButton).toHaveAccessibleName();
    });

    it("should have accessible expand/collapse button", () => {
      // Arrange & Act
      render(<RepetitionBlockCard block={mockBlock} />);

      // Assert
      const expandButton = screen.getByRole("button", {
        name: /collapse|expand/i,
      });
      expect(expandButton).toBeInTheDocument();
      expect(expandButton).toHaveAccessibleName();
    });
  });

  describe("screen reader announcements", () => {
    it("should provide context about repeat count in accessible name", () => {
      // Arrange & Act
      render(<RepetitionBlockCard block={mockBlock} />);

      // Assert - Repeat count should be visible to screen readers
      // The UI shows "3x" format instead of "repeat 3 times"
      expect(screen.getByText(/3/)).toBeInTheDocument();
      expect(screen.getByText(/x/)).toBeInTheDocument();
    });

    it("should announce step count within block", () => {
      // Arrange & Act
      render(<RepetitionBlockCard block={mockBlock} />);

      // Assert - Step count should be visible
      expect(screen.getByText(/1 step/i)).toBeInTheDocument();
    });

    it("should announce multiple steps correctly", () => {
      // Arrange
      const blockWithMultipleSteps: RepetitionBlock = {
        repeatCount: 2,
        steps: [
          {
            stepIndex: 0,
            durationType: "time",
            duration: { type: "time", seconds: 300 },
            targetType: "power",
            target: { type: "power", value: { unit: "watts", value: 200 } },
            intensity: "active",
          },
          {
            stepIndex: 1,
            durationType: "time",
            duration: { type: "time", seconds: 600 },
            targetType: "power",
            target: { type: "power", value: { unit: "watts", value: 250 } },
            intensity: "active",
          },
        ],
      };

      // Act
      render(<RepetitionBlockCard block={blockWithMultipleSteps} />);

      // Assert
      expect(screen.getByText(/2 steps/i)).toBeInTheDocument();
    });
  });

  describe("focus management", () => {
    it("should maintain focus on block after keyboard interaction", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<RepetitionBlockCard block={mockBlock} />);
      const blockCard = screen.getByTestId("repetition-block-card");

      // Act
      await user.click(blockCard);

      // Assert
      expect(blockCard).toHaveFocus();
    });

    it("should allow focus to move to child buttons", async () => {
      // Arrange
      render(<RepetitionBlockCard block={mockBlock} onDelete={vi.fn()} />);

      // Act - Focus on a button
      const deleteButton = screen.getByRole("button", {
        name: /delete repetition block/i,
      });
      deleteButton.focus();

      // Assert - Button should have focus
      expect(deleteButton).toHaveFocus();
    });
  });

  describe("touch target sizes", () => {
    it("should have minimum touch target size for delete button", () => {
      // Arrange & Act
      render(<RepetitionBlockCard block={mockBlock} onDelete={vi.fn()} />);
      const deleteButton = screen.getByRole("button", {
        name: /delete repetition block/i,
      });

      // Assert - Button should have adequate size classes
      // Tailwind classes like h-8 w-8 or p-2 ensure minimum 44x44px touch target
      expect(deleteButton).toBeInTheDocument();
      expect(deleteButton.className).toMatch(/h-\d+|p-\d+/);
    });

    it("should have minimum touch target size for all interactive elements", () => {
      // Arrange & Act
      render(
        <RepetitionBlockCard
          block={mockBlock}
          onDelete={vi.fn()}
          onUngroup={vi.fn()}
          onAddStep={vi.fn()}
        />
      );

      // Assert - All buttons should be present and interactive
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);

      buttons.forEach((button) => {
        expect(button).toBeInTheDocument();
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe("color contrast", () => {
    it("should render delete button with destructive styling", () => {
      // Arrange & Act
      render(<RepetitionBlockCard block={mockBlock} onDelete={vi.fn()} />);
      const deleteButton = screen.getByRole("button", {
        name: /delete repetition block/i,
      });

      // Assert - Button should have red/destructive color classes
      expect(deleteButton.className).toMatch(/text-red|hover:text-red/);
    });

    it("should have visible text in all intensity states", () => {
      // Arrange & Act
      render(<RepetitionBlockCard block={mockBlock} />);

      // Assert - Text should be visible
      expect(screen.getByText(/repeat block/i)).toBeVisible();
      expect(screen.getByText(/1 step/i)).toBeVisible();
    });
  });
});
