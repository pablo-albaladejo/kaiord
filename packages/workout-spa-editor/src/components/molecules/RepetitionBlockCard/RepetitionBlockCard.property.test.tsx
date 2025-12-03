/**
 * Property-Based Tests for RepetitionBlockCard
 *
 * Feature: workout-spa-editor/09-repetition-blocks-and-ui-polish
 * Property 8: UI delete triggers actual deletion
 * Validates: Requirements 3.2
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { RepetitionBlock, WorkoutStep } from "../../../types/krd";
import { RepetitionBlockCard } from "./RepetitionBlockCard";

describe("RepetitionBlockCard - Property Tests", () => {
  /**
   * Property 8: UI delete triggers actual deletion
   *
   * For any repetition block, clicking the delete button should result
   * in the block being removed from the workout.
   *
   * Validates: Requirements 3.2
   */
  describe("Property 8: UI delete triggers actual deletion", () => {
    it("should call onDelete when delete button is clicked for any block", async () => {
      // Arrange - Generate a random repetition block
      const randomRepeatCount = Math.floor(Math.random() * 10) + 1;
      const randomStepCount = Math.floor(Math.random() * 5) + 1;

      const steps: WorkoutStep[] = Array.from(
        { length: randomStepCount },
        (_, i) => ({
          stepIndex: i,
          durationType: "time" as const,
          duration: {
            type: "time" as const,
            seconds: Math.floor(Math.random() * 600) + 60,
          },
          targetType: "power" as const,
          target: {
            type: "power" as const,
            value: {
              unit: "watts" as const,
              value: Math.floor(Math.random() * 300) + 100,
            },
          },
          intensity: "active" as const,
        })
      );

      const block: RepetitionBlock = {
        repeatCount: randomRepeatCount,
        steps,
      };

      const onDelete = vi.fn();
      const user = userEvent.setup();

      // Act
      render(<RepetitionBlockCard block={block} onDelete={onDelete} />);
      const deleteButton = screen.getByTestId("delete-block-button");
      await user.click(deleteButton);

      // Assert
      expect(onDelete).toHaveBeenCalledOnce();
    });

    it("should call onDelete exactly once per click for multiple clicks", async () => {
      // Arrange
      const block: RepetitionBlock = {
        repeatCount: 3,
        steps: [
          {
            stepIndex: 0,
            durationType: "time" as const,
            duration: {
              type: "time" as const,
              seconds: 300,
            },
            targetType: "open" as const,
            target: {
              type: "open" as const,
            },
            intensity: "active" as const,
          },
        ],
      };

      const onDelete = vi.fn();
      const user = userEvent.setup();

      // Act
      render(<RepetitionBlockCard block={block} onDelete={onDelete} />);
      const deleteButton = screen.getByTestId("delete-block-button");

      // Click multiple times
      await user.click(deleteButton);
      await user.click(deleteButton);
      await user.click(deleteButton);

      // Assert - Should be called 3 times (once per click)
      expect(onDelete).toHaveBeenCalledTimes(3);
    });

    it("should trigger delete for blocks with varying step counts", async () => {
      // Arrange - Test with different step counts
      const stepCounts = [1, 2, 5, 10];

      for (const stepCount of stepCounts) {
        const steps: WorkoutStep[] = Array.from(
          { length: stepCount },
          (_, i) => ({
            stepIndex: i,
            durationType: "time" as const,
            duration: {
              type: "time" as const,
              seconds: 300,
            },
            targetType: "open" as const,
            target: {
              type: "open" as const,
            },
            intensity: "active" as const,
          })
        );

        const block: RepetitionBlock = {
          repeatCount: 2,
          steps,
        };

        const onDelete = vi.fn();
        const user = userEvent.setup();

        // Act
        const { unmount } = render(
          <RepetitionBlockCard block={block} onDelete={onDelete} />
        );
        const deleteButton = screen.getByTestId("delete-block-button");
        await user.click(deleteButton);

        // Assert
        expect(onDelete).toHaveBeenCalledOnce();

        // Cleanup for next iteration
        unmount();
      }
    });

    it("should trigger delete for blocks with varying repeat counts", async () => {
      // Arrange - Test with different repeat counts
      const repeatCounts = [1, 2, 5, 10, 20];

      for (const repeatCount of repeatCounts) {
        const block: RepetitionBlock = {
          repeatCount,
          steps: [
            {
              stepIndex: 0,
              durationType: "time" as const,
              duration: {
                type: "time" as const,
                seconds: 300,
              },
              targetType: "open" as const,
              target: {
                type: "open" as const,
              },
              intensity: "active" as const,
            },
          ],
        };

        const onDelete = vi.fn();
        const user = userEvent.setup();

        // Act
        const { unmount } = render(
          <RepetitionBlockCard block={block} onDelete={onDelete} />
        );
        const deleteButton = screen.getByTestId("delete-block-button");
        await user.click(deleteButton);

        // Assert
        expect(onDelete).toHaveBeenCalledOnce();

        // Cleanup for next iteration
        unmount();
      }
    });

    it("should not call onDelete when button is not provided", async () => {
      // Arrange
      const block: RepetitionBlock = {
        repeatCount: 3,
        steps: [
          {
            stepIndex: 0,
            durationType: "time" as const,
            duration: {
              type: "time" as const,
              seconds: 300,
            },
            targetType: "open" as const,
            target: {
              type: "open" as const,
            },
            intensity: "active" as const,
          },
        ],
      };

      // Act
      render(<RepetitionBlockCard block={block} />);

      // Assert - Delete button should not exist
      expect(
        screen.queryByTestId("delete-block-button")
      ).not.toBeInTheDocument();
    });
  });

  /**
   * Property 9: Keyboard delete equivalence
   *
   * For any repetition block, deleting via Delete key, Backspace key,
   * or UI button should produce identical results including undo capability.
   *
   * Validates: Requirements 3.6, 4.1, 4.6
   */
  describe("Property 9: Keyboard delete equivalence", () => {
    it("should call onDelete when Delete key is pressed for any block", async () => {
      // Arrange - Generate a random repetition block
      const randomRepeatCount = Math.floor(Math.random() * 10) + 1;
      const randomStepCount = Math.floor(Math.random() * 5) + 1;

      const steps: WorkoutStep[] = Array.from(
        { length: randomStepCount },
        (_, i) => ({
          stepIndex: i,
          durationType: "time" as const,
          duration: {
            type: "time" as const,
            seconds: Math.floor(Math.random() * 600) + 60,
          },
          targetType: "power" as const,
          target: {
            type: "power" as const,
            value: {
              unit: "watts" as const,
              value: Math.floor(Math.random() * 300) + 100,
            },
          },
          intensity: "active" as const,
        })
      );

      const block: RepetitionBlock = {
        repeatCount: randomRepeatCount,
        steps,
      };

      const onDelete = vi.fn();
      const user = userEvent.setup();

      // Act
      render(<RepetitionBlockCard block={block} onDelete={onDelete} />);
      const blockCard = screen.getByTestId("repetition-block-card");
      blockCard.focus();
      await user.keyboard("{Delete}");

      // Assert
      expect(onDelete).toHaveBeenCalledOnce();
    });

    it("should call onDelete when Backspace key is pressed for any block", async () => {
      // Arrange - Generate a random repetition block
      const randomRepeatCount = Math.floor(Math.random() * 10) + 1;
      const randomStepCount = Math.floor(Math.random() * 5) + 1;

      const steps: WorkoutStep[] = Array.from(
        { length: randomStepCount },
        (_, i) => ({
          stepIndex: i,
          durationType: "time" as const,
          duration: {
            type: "time" as const,
            seconds: Math.floor(Math.random() * 600) + 60,
          },
          targetType: "power" as const,
          target: {
            type: "power" as const,
            value: {
              unit: "watts" as const,
              value: Math.floor(Math.random() * 300) + 100,
            },
          },
          intensity: "active" as const,
        })
      );

      const block: RepetitionBlock = {
        repeatCount: randomRepeatCount,
        steps,
      };

      const onDelete = vi.fn();
      const user = userEvent.setup();

      // Act
      render(<RepetitionBlockCard block={block} onDelete={onDelete} />);
      const blockCard = screen.getByTestId("repetition-block-card");
      blockCard.focus();
      await user.keyboard("{Backspace}");

      // Assert
      expect(onDelete).toHaveBeenCalledOnce();
    });

    it("should produce identical results for Delete key, Backspace key, and UI button", async () => {
      // Arrange - Create identical blocks for each deletion method
      const createBlock = (): RepetitionBlock => ({
        repeatCount: 3,
        steps: [
          {
            stepIndex: 0,
            durationType: "time" as const,
            duration: {
              type: "time" as const,
              seconds: 300,
            },
            targetType: "power" as const,
            target: {
              type: "power" as const,
              value: {
                unit: "watts" as const,
                value: 200,
              },
            },
            intensity: "active" as const,
          },
          {
            stepIndex: 1,
            durationType: "distance" as const,
            duration: {
              type: "distance" as const,
              meters: 1000,
            },
            targetType: "heart_rate" as const,
            target: {
              type: "heart_rate" as const,
              value: {
                unit: "bpm" as const,
                value: 150,
              },
            },
            intensity: "active" as const,
          },
        ],
      });

      const onDeleteViaButton = vi.fn();
      const onDeleteViaDeleteKey = vi.fn();
      const onDeleteViaBackspaceKey = vi.fn();
      const user = userEvent.setup();

      // Act - Test UI button deletion
      const { unmount: unmount1 } = render(
        <RepetitionBlockCard
          block={createBlock()}
          onDelete={onDeleteViaButton}
        />
      );
      const deleteButton = screen.getByTestId("delete-block-button");
      await user.click(deleteButton);
      unmount1();

      // Act - Test Delete key deletion
      const { unmount: unmount2 } = render(
        <RepetitionBlockCard
          block={createBlock()}
          onDelete={onDeleteViaDeleteKey}
        />
      );
      const blockCard1 = screen.getByTestId("repetition-block-card");
      blockCard1.focus();
      await user.keyboard("{Delete}");
      unmount2();

      // Act - Test Backspace key deletion
      const { unmount: unmount3 } = render(
        <RepetitionBlockCard
          block={createBlock()}
          onDelete={onDeleteViaBackspaceKey}
        />
      );
      const blockCard2 = screen.getByTestId("repetition-block-card");
      blockCard2.focus();
      await user.keyboard("{Backspace}");
      unmount3();

      // Assert - All three methods should call onDelete exactly once
      // This demonstrates equivalence: all three methods trigger deletion
      expect(onDeleteViaButton).toHaveBeenCalledOnce();
      expect(onDeleteViaDeleteKey).toHaveBeenCalledOnce();
      expect(onDeleteViaBackspaceKey).toHaveBeenCalledOnce();
    });

    it("should not call onDelete when other keys are pressed", async () => {
      // Arrange
      const block: RepetitionBlock = {
        repeatCount: 3,
        steps: [
          {
            stepIndex: 0,
            durationType: "time" as const,
            duration: {
              type: "time" as const,
              seconds: 300,
            },
            targetType: "open" as const,
            target: {
              type: "open" as const,
            },
            intensity: "active" as const,
          },
        ],
      };

      const onDelete = vi.fn();
      const user = userEvent.setup();

      // Act
      render(<RepetitionBlockCard block={block} onDelete={onDelete} />);
      const blockCard = screen.getByTestId("repetition-block-card");
      blockCard.focus();

      // Try various keys that should NOT trigger deletion
      await user.keyboard("{Enter}");
      await user.keyboard("{Escape}");
      await user.keyboard("{Space}");
      await user.keyboard("a");
      await user.keyboard("{ArrowUp}");
      await user.keyboard("{ArrowDown}");

      // Assert
      expect(onDelete).not.toHaveBeenCalled();
    });

    it("should not call onDelete via keyboard when onDelete is not provided", async () => {
      // Arrange
      const block: RepetitionBlock = {
        repeatCount: 3,
        steps: [
          {
            stepIndex: 0,
            durationType: "time" as const,
            duration: {
              type: "time" as const,
              seconds: 300,
            },
            targetType: "open" as const,
            target: {
              type: "open" as const,
            },
            intensity: "active" as const,
          },
        ],
      };

      const user = userEvent.setup();

      // Act
      render(<RepetitionBlockCard block={block} />);
      const blockCard = screen.getByTestId("repetition-block-card");
      blockCard.focus();

      // Try to delete via keyboard - should not throw error
      await user.keyboard("{Delete}");
      await user.keyboard("{Backspace}");

      // Assert - No error should be thrown, component should still be rendered
      expect(blockCard).toBeInTheDocument();
    });
  });

  /**
   * Property 10: Focus management after deletion
   *
   * For any workout with multiple blocks, after deleting a block via keyboard,
   * focus should move to the next block if available, otherwise to the previous
   * block or add button.
   *
   * Note: This property tests the component's role in focus management.
   * The actual focus movement is handled by the parent component.
   *
   * Validates: Requirements 4.4
   */
  describe("Property 10: Focus management after deletion", () => {
    it("should maintain focusability via tabIndex for keyboard navigation", () => {
      // Arrange
      const block: RepetitionBlock = {
        repeatCount: 3,
        steps: [
          {
            stepIndex: 0,
            durationType: "time" as const,
            duration: {
              type: "time" as const,
              seconds: 300,
            },
            targetType: "open" as const,
            target: {
              type: "open" as const,
            },
            intensity: "active" as const,
          },
        ],
      };

      const onDelete = vi.fn();

      // Act
      render(<RepetitionBlockCard block={block} onDelete={onDelete} />);
      const blockCard = screen.getByTestId("repetition-block-card");

      // Assert - Component should be focusable via keyboard
      expect(blockCard).toHaveAttribute("tabIndex", "0");
    });

    it("should allow focus to be programmatically set for any block", () => {
      // Arrange - Create multiple blocks with different configurations
      const blocks: RepetitionBlock[] = [
        {
          repeatCount: 2,
          steps: [
            {
              stepIndex: 0,
              durationType: "time" as const,
              duration: { type: "time" as const, seconds: 300 },
              targetType: "open" as const,
              target: { type: "open" as const },
              intensity: "active" as const,
            },
          ],
        },
        {
          repeatCount: 5,
          steps: [
            {
              stepIndex: 0,
              durationType: "distance" as const,
              duration: { type: "distance" as const, meters: 1000 },
              targetType: "power" as const,
              target: {
                type: "power" as const,
                value: { unit: "watts" as const, value: 200 },
              },
              intensity: "active" as const,
            },
          ],
        },
      ];

      // Act - Render multiple blocks
      const { container } = render(
        <div>
          {blocks.map((block, index) => (
            <RepetitionBlockCard key={index} block={block} onDelete={vi.fn()} />
          ))}
        </div>
      );

      const blockCards = container.querySelectorAll(
        '[data-testid="repetition-block-card"]'
      );

      // Assert - All blocks should be focusable
      blockCards.forEach((blockCard) => {
        expect(blockCard).toHaveAttribute("tabIndex", "0");
      });

      // Assert - Focus can be programmatically set
      (blockCards[0] as HTMLElement).focus();
      expect(document.activeElement).toBe(blockCards[0]);

      (blockCards[1] as HTMLElement).focus();
      expect(document.activeElement).toBe(blockCards[1]);
    });

    it("should maintain focus on the block when keyboard shortcuts are used", async () => {
      // Arrange
      const block: RepetitionBlock = {
        repeatCount: 3,
        steps: [
          {
            stepIndex: 0,
            durationType: "time" as const,
            duration: {
              type: "time" as const,
              seconds: 300,
            },
            targetType: "open" as const,
            target: {
              type: "open" as const,
            },
            intensity: "active" as const,
          },
        ],
      };

      const onDelete = vi.fn();
      const user = userEvent.setup();

      // Act
      render(<RepetitionBlockCard block={block} onDelete={onDelete} />);
      const blockCard = screen.getByTestId("repetition-block-card");

      // Focus the block
      blockCard.focus();
      expect(document.activeElement).toBe(blockCard);

      // Press Delete key
      await user.keyboard("{Delete}");

      // Assert - onDelete should be called, allowing parent to manage focus
      expect(onDelete).toHaveBeenCalledOnce();
    });

    it("should not interfere with focus when deletion is triggered", async () => {
      // Arrange
      const block: RepetitionBlock = {
        repeatCount: 3,
        steps: [
          {
            stepIndex: 0,
            durationType: "time" as const,
            duration: {
              type: "time" as const,
              seconds: 300,
            },
            targetType: "open" as const,
            target: {
              type: "open" as const,
            },
            intensity: "active" as const,
          },
        ],
      };

      let focusBeforeDeletion: Element | null = null;
      const onDelete = vi.fn(() => {
        focusBeforeDeletion = document.activeElement;
      });
      const user = userEvent.setup();

      // Act
      render(<RepetitionBlockCard block={block} onDelete={onDelete} />);
      const blockCard = screen.getByTestId("repetition-block-card");

      blockCard.focus();
      await user.keyboard("{Delete}");

      // Assert - Focus should still be on the block when onDelete is called
      // This allows the parent component to determine where to move focus
      expect(focusBeforeDeletion).toBe(blockCard);
    });

    it("should support keyboard navigation for blocks with varying configurations", async () => {
      // Arrange - Test with different block configurations
      const configurations = [
        { repeatCount: 1, stepCount: 1 },
        { repeatCount: 5, stepCount: 3 },
        { repeatCount: 10, stepCount: 10 },
      ];

      for (const config of configurations) {
        const steps: WorkoutStep[] = Array.from(
          { length: config.stepCount },
          (_, i) => ({
            stepIndex: i,
            durationType: "time" as const,
            duration: {
              type: "time" as const,
              seconds: 300,
            },
            targetType: "open" as const,
            target: {
              type: "open" as const,
            },
            intensity: "active" as const,
          })
        );

        const block: RepetitionBlock = {
          repeatCount: config.repeatCount,
          steps,
        };

        const onDelete = vi.fn();
        const user = userEvent.setup();

        // Act
        const { unmount } = render(
          <RepetitionBlockCard block={block} onDelete={onDelete} />
        );
        const blockCard = screen.getByTestId("repetition-block-card");

        // Focus and delete
        blockCard.focus();
        await user.keyboard("{Delete}");

        // Assert
        expect(onDelete).toHaveBeenCalledOnce();
        expect(blockCard).toHaveAttribute("tabIndex", "0");

        // Cleanup
        unmount();
      }
    });
  });
});
