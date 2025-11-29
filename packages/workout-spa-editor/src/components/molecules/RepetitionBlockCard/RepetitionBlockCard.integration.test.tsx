/**
 * Integration tests for RepetitionBlockCard with context menu
 *
 * Requirements:
 * - Requirement 7.5: Context menu integration with block actions
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { RepetitionBlock } from "../../../types/krd";
import { RepetitionBlockCard } from "./RepetitionBlockCard";

describe("RepetitionBlockCard - Context Menu Integration", () => {
  const mockBlock: RepetitionBlock = {
    repeatCount: 3,
    steps: [
      {
        stepIndex: 0,
        durationType: "time",
        duration: { type: "time", seconds: 300 },
        targetType: "power",
        target: {
          type: "power",
          value: { unit: "watts", value: 200 },
        },
      },
      {
        stepIndex: 1,
        durationType: "time",
        duration: { type: "time", seconds: 60 },
        targetType: "power",
        target: {
          type: "power",
          value: { unit: "watts", value: 100 },
        },
      },
    ],
  };

  describe("context menu rendering", () => {
    it("should render context menu when handlers are provided", () => {
      // Arrange
      const onAddStep = vi.fn();
      const onUngroup = vi.fn();
      const onDelete = vi.fn();

      // Act
      render(
        <RepetitionBlockCard
          block={mockBlock}
          onAddStep={onAddStep}
          onUngroup={onUngroup}
          onDelete={onDelete}
        />
      );

      // Assert
      const trigger = screen.getByTestId("block-actions-trigger");
      expect(trigger).toBeInTheDocument();
    });

    it("should not render context menu when no handlers are provided", () => {
      // Arrange & Act
      render(<RepetitionBlockCard block={mockBlock} />);

      // Assert
      const trigger = screen.queryByTestId("block-actions-trigger");
      expect(trigger).not.toBeInTheDocument();
    });

    it("should render context menu when only onAddStep is provided", () => {
      // Arrange
      const onAddStep = vi.fn();

      // Act
      render(<RepetitionBlockCard block={mockBlock} onAddStep={onAddStep} />);

      // Assert
      const trigger = screen.getByTestId("block-actions-trigger");
      expect(trigger).toBeInTheDocument();
    });
  });

  describe("context menu actions", () => {
    it("should call onAddStep when Add Step is clicked", async () => {
      // Arrange
      const onAddStep = vi.fn();
      const user = userEvent.setup();
      render(<RepetitionBlockCard block={mockBlock} onAddStep={onAddStep} />);

      // Act
      await user.click(screen.getByTestId("block-actions-trigger"));
      await user.click(screen.getByTestId("add-step-action"));

      // Assert
      expect(onAddStep).toHaveBeenCalledOnce();
    });

    it("should call onUngroup when Ungroup is clicked", async () => {
      // Arrange
      const onUngroup = vi.fn();
      const user = userEvent.setup();
      render(<RepetitionBlockCard block={mockBlock} onUngroup={onUngroup} />);

      // Act
      await user.click(screen.getByTestId("block-actions-trigger"));
      await user.click(screen.getByTestId("ungroup-action"));

      // Assert
      expect(onUngroup).toHaveBeenCalledOnce();
    });

    it("should call onDelete when Delete is clicked", async () => {
      // Arrange
      const onDelete = vi.fn();
      const user = userEvent.setup();
      render(<RepetitionBlockCard block={mockBlock} onDelete={onDelete} />);

      // Act
      await user.click(screen.getByTestId("block-actions-trigger"));
      await user.click(screen.getByTestId("delete-action"));

      // Assert
      expect(onDelete).toHaveBeenCalledOnce();
    });

    it("should activate inline editing when Edit Count is clicked", async () => {
      // Arrange
      const onEditRepeatCount = vi.fn();
      const user = userEvent.setup();
      render(
        <RepetitionBlockCard
          block={mockBlock}
          onEditRepeatCount={onEditRepeatCount}
          onAddStep={vi.fn()}
        />
      );

      // Act
      await user.click(screen.getByTestId("block-actions-trigger"));
      await user.click(screen.getByTestId("edit-count-action"));

      // Assert
      const input = screen.getByRole("spinbutton");
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue(3);
    });
  });

  describe("context menu with all handlers", () => {
    it("should handle all actions correctly", async () => {
      // Arrange
      const onAddStep = vi.fn();
      const onUngroup = vi.fn();
      const onDelete = vi.fn();
      const onEditRepeatCount = vi.fn();
      const user = userEvent.setup();

      render(
        <RepetitionBlockCard
          block={mockBlock}
          onAddStep={onAddStep}
          onUngroup={onUngroup}
          onDelete={onDelete}
          onEditRepeatCount={onEditRepeatCount}
        />
      );

      // Act & Assert - Test Add Step
      await user.click(screen.getByTestId("block-actions-trigger"));
      await user.click(screen.getByTestId("add-step-action"));
      expect(onAddStep).toHaveBeenCalledOnce();

      // Act & Assert - Test Ungroup
      await user.click(screen.getByTestId("block-actions-trigger"));
      await user.click(screen.getByTestId("ungroup-action"));
      expect(onUngroup).toHaveBeenCalledOnce();

      // Act & Assert - Test Delete
      await user.click(screen.getByTestId("block-actions-trigger"));
      await user.click(screen.getByTestId("delete-action"));
      expect(onDelete).toHaveBeenCalledOnce();
    });
  });
});
