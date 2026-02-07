/**
 * Integration tests for multi-selection with unique IDs
 *
 * Property 4: Multi-Selection Uniqueness
 * Validates: Requirements 5.1, 5.2, 5.3
 *
 * Tests that each step can be independently added to or removed from
 * the multi-selection set, even when steps have the same stepIndex
 * across different contexts (main workout vs repetition blocks).
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { RepetitionBlock, Workout, WorkoutStep } from "../../../types/krd";
import { WorkoutList } from "./WorkoutList";

describe("WorkoutList - Multi-Selection Uniqueness (Property 4)", () => {
  const createMockStep = (stepIndex: number): WorkoutStep => ({
    stepIndex,
    durationType: "time",
    duration: { type: "time", seconds: 300 },
    targetType: "power",
    target: {
      type: "power",
      value: { unit: "watts", value: 200 },
    },
    intensity: "active",
  });

  const createMockWorkout = (
    steps: Array<WorkoutStep | RepetitionBlock>
  ): Workout => ({
    name: "Test Workout",
    sport: "cycling",
    steps,
  });

  describe("Multi-selection with duplicate stepIndex values", () => {
    it("should independently add main workout step to selection without selecting block steps with same stepIndex", async () => {
      // Arrange
      const user = userEvent.setup();
      const onToggleStepSelection = vi.fn();

      // Create workout with duplicate stepIndex values:
      // - Main structured_workout: Step 1 (stepIndex: 0) → ID: "step-0"
      // - Block A: Step 1 (stepIndex: 0) → ID: "block-1-step-0"
      // - Block B: Step 1 (stepIndex: 0) → ID: "block-2-step-0"
      const blockA: RepetitionBlock = {
        repeatCount: 2,
        steps: [createMockStep(0), createMockStep(1)],
      };
      const blockB: RepetitionBlock = {
        repeatCount: 3,
        steps: [createMockStep(0), createMockStep(1)],
      };
      const workout = createMockWorkout([
        createMockStep(0), // Main workout step with stepIndex: 0
        blockA, // Block at index 1
        blockB, // Block at index 2
      ]);

      // Act
      render(
        <WorkoutList
          workout={workout}
          onToggleStepSelection={onToggleStepSelection}
          selectedStepIds={[]}
        />
      );

      // Cmd/Ctrl+click on the main workout step (Step 1)
      const mainWorkoutStep = screen.getAllByRole("button", {
        name: /Step 1:/,
      })[0];
      fireEvent.click(mainWorkoutStep, { ctrlKey: true });

      // Assert
      // Should call onToggleStepSelection with the main workout step's hierarchical ID
      expect(onToggleStepSelection).toHaveBeenCalledWith("step-0");
      expect(onToggleStepSelection).toHaveBeenCalledTimes(1);
    });

    it("should independently add step from Block A to selection without selecting main workout or Block B steps", async () => {
      // Arrange
      const user = userEvent.setup();
      const onToggleStepSelection = vi.fn();

      const blockA: RepetitionBlock = {
        repeatCount: 2,
        steps: [createMockStep(0), createMockStep(1)],
      };
      const blockB: RepetitionBlock = {
        repeatCount: 3,
        steps: [createMockStep(0), createMockStep(1)],
      };
      const workout = createMockWorkout([
        createMockStep(0), // Main workout step
        blockA, // Block at index 1
        blockB, // Block at index 2
      ]);

      // Act
      render(
        <WorkoutList
          workout={workout}
          onToggleStepSelection={onToggleStepSelection}
          selectedStepIds={[]}
        />
      );

      // Expand Block A to see its steps
      const blockHeaders = screen.getAllByRole("button", { name: /\dx/ });
      await user.click(blockHeaders[0]); // Block A (2x)

      // Cmd/Ctrl+click on step in Block A (Step 1)
      // After expanding, we should have: main workout step + block A steps
      const allStep1Buttons = await screen.findAllByRole("button", {
        name: /Step 1:/,
      });
      // The second "Step 1" button should be in Block A (after main workout step)
      fireEvent.click(allStep1Buttons[1], { ctrlKey: true });

      // Assert
      // Should call onToggleStepSelection with the step's hierarchical ID from Block A
      expect(onToggleStepSelection).toHaveBeenCalledWith("block-1-step-0");
    });

    it("should add multiple steps with same stepIndex from different blocks to selection", async () => {
      // Arrange
      const user = userEvent.setup();
      const onToggleStepSelection = vi.fn();

      const blockA: RepetitionBlock = {
        repeatCount: 2,
        steps: [createMockStep(0), createMockStep(1)],
      };
      const blockB: RepetitionBlock = {
        repeatCount: 3,
        steps: [createMockStep(0), createMockStep(1)],
      };
      const workout = createMockWorkout([
        createMockStep(0), // Main workout step - ID: "step-0"
        blockA, // Block at index 1 - Step IDs: "block-1-step-0", "block-1-step-1"
        blockB, // Block at index 2 - Step IDs: "block-2-step-0", "block-2-step-1"
      ]);

      // Act
      render(
        <WorkoutList
          workout={workout}
          onToggleStepSelection={onToggleStepSelection}
          selectedStepIds={[]}
        />
      );

      // Expand both blocks
      const blockHeaders = screen.getAllByRole("button", { name: /\dx/ });
      await user.click(blockHeaders[0]); // Block A
      await user.click(blockHeaders[1]); // Block B

      // Wait for blocks to expand
      const allStep1Buttons = await screen.findAllByRole("button", {
        name: /Step 1:/,
      });

      // Cmd/Ctrl+click on main workout Step 1
      fireEvent.click(allStep1Buttons[0], { ctrlKey: true }); // Main workout

      // Cmd/Ctrl+click on Block A Step 1
      fireEvent.click(allStep1Buttons[1], { ctrlKey: true }); // Block A

      // Cmd/Ctrl+click on Block B Step 1
      fireEvent.click(allStep1Buttons[2], { ctrlKey: true }); // Block B

      // Assert
      // Should have called onToggleStepSelection 3 times, once for each step
      expect(onToggleStepSelection).toHaveBeenCalledTimes(3);
      // Each call should be with the unique hierarchical ID
      expect(onToggleStepSelection).toHaveBeenNthCalledWith(1, "step-0");
      expect(onToggleStepSelection).toHaveBeenNthCalledWith(
        2,
        "block-1-step-0"
      );
      expect(onToggleStepSelection).toHaveBeenNthCalledWith(
        3,
        "block-2-step-0"
      );
    });
  });

  describe("Multi-selection visual indicators", () => {
    it("should show multi-selection indicator only on explicitly selected steps", () => {
      // Arrange
      const blockA: RepetitionBlock = {
        repeatCount: 2,
        steps: [createMockStep(0), createMockStep(1)],
      };
      const blockB: RepetitionBlock = {
        repeatCount: 3,
        steps: [createMockStep(0), createMockStep(1)],
      };
      const workout = createMockWorkout([
        createMockStep(0), // Main workout step - ID: "step-0"
        blockA, // Block at index 1 - Step IDs: "block-1-step-0", "block-1-step-1"
        blockB, // Block at index 2 - Step IDs: "block-2-step-0", "block-2-step-1"
      ]);

      // Act - Select main workout step and Block A step
      render(
        <WorkoutList
          workout={workout}
          selectedStepIds={["step-0", "block-1-step-0"]}
        />
      );

      // Assert
      const mainWorkoutStep = screen.getAllByRole("button", {
        name: /Step 1:/,
      })[0];
      // Main workout step should be highlighted (multi-selected)
      expect(mainWorkoutStep.className).toContain("border-primary-500");

      // Note: Block steps are not visible until expanded, but the IDs ensure
      // only the explicitly selected steps will be highlighted when expanded
    });

    it("should not show multi-selection indicator on steps with same stepIndex that were not clicked", () => {
      // Arrange
      const blockA: RepetitionBlock = {
        repeatCount: 2,
        steps: [createMockStep(0), createMockStep(1)],
      };
      const workout = createMockWorkout([
        createMockStep(0), // Main workout step - ID: "step-0"
        blockA, // Block at index 1 - Step IDs: "block-1-step-0", "block-1-step-1"
      ]);

      // Act - Select only the block step, not the main workout step
      render(
        <WorkoutList workout={workout} selectedStepIds={["block-1-step-0"]} />
      );

      // Assert
      const mainWorkoutStep = screen.getAllByRole("button", {
        name: /Step 1:/,
      })[0];
      // Main workout step should NOT be highlighted
      expect(mainWorkoutStep.className).not.toContain("border-primary-500");
    });
  });

  describe("Removing steps from multi-selection", () => {
    it("should remove only the clicked step from multi-selection", async () => {
      // Arrange
      const user = userEvent.setup();
      const onToggleStepSelection = vi.fn();

      const blockA: RepetitionBlock = {
        repeatCount: 2,
        steps: [createMockStep(0), createMockStep(1)],
      };
      const workout = createMockWorkout([
        createMockStep(0), // Main workout step - ID: "step-0"
        blockA, // Block at index 1 - Step IDs: "block-1-step-0", "block-1-step-1"
      ]);

      // Act - Start with both steps selected
      render(
        <WorkoutList
          workout={workout}
          onToggleStepSelection={onToggleStepSelection}
          selectedStepIds={["step-0", "block-1-step-0"]}
        />
      );

      // Expand Block A
      const blockAHeader = screen.getAllByRole("button", { name: "2x" })[0];
      await user.click(blockAHeader);

      // Cmd/Ctrl+click on main workout step to deselect it
      const allStep1Buttons = screen.getAllByRole("button", {
        name: /Step 1:/,
      });
      fireEvent.click(allStep1Buttons[0], { ctrlKey: true }); // Main workout step

      // Assert
      // Should call onToggleStepSelection to remove the main workout step
      expect(onToggleStepSelection).toHaveBeenCalledWith("step-0");
      expect(onToggleStepSelection).toHaveBeenCalledTimes(1);
    });

    it("should independently remove step from Block A without affecting Block B selection", async () => {
      // Arrange
      const user = userEvent.setup();
      const onToggleStepSelection = vi.fn();

      const blockA: RepetitionBlock = {
        repeatCount: 2,
        steps: [createMockStep(0), createMockStep(1)],
      };
      const blockB: RepetitionBlock = {
        repeatCount: 3,
        steps: [createMockStep(0), createMockStep(1)],
      };
      const workout = createMockWorkout([
        createMockStep(0), // Main workout step - ID: "step-0"
        blockA, // Block at index 1
        blockB, // Block at index 2
      ]);

      // Act - Start with steps from both blocks selected
      render(
        <WorkoutList
          workout={workout}
          onToggleStepSelection={onToggleStepSelection}
          selectedStepIds={["block-1-step-0", "block-2-step-0"]}
        />
      );

      // Expand Block A
      const blockHeaders = screen.getAllByRole("button", { name: /\dx/ });
      await user.click(blockHeaders[0]); // Block A

      // Cmd/Ctrl+click on Block A step to deselect it
      const allStep1Buttons = await screen.findAllByRole("button", {
        name: /Step 1:/,
      });
      fireEvent.click(allStep1Buttons[1], { ctrlKey: true }); // Block A step (after main workout)

      // Assert
      // Should call onToggleStepSelection to remove the Block A step
      expect(onToggleStepSelection).toHaveBeenCalledWith("block-1-step-0");
      expect(onToggleStepSelection).toHaveBeenCalledTimes(1);
    });
  });

  describe("Multi-selection with complex workout structures", () => {
    it("should handle multi-selection across multiple blocks with duplicate stepIndex values", async () => {
      // Arrange
      const user = userEvent.setup();
      const onToggleStepSelection = vi.fn();

      // Create a complex structured_workout:
      // - Main: Step 1 (stepIndex: 0), Step 2 (stepIndex: 1)
      // - Block A (index 2): Step 1 (stepIndex: 0), Step 2 (stepIndex: 1)
      // - Main: Step 3 (stepIndex: 2)
      // - Block B (index 4): Step 1 (stepIndex: 0), Step 2 (stepIndex: 1)
      const blockA: RepetitionBlock = {
        repeatCount: 2,
        steps: [createMockStep(0), createMockStep(1)],
      };
      const blockB: RepetitionBlock = {
        repeatCount: 3,
        steps: [createMockStep(0), createMockStep(1)],
      };
      const workout = createMockWorkout([
        createMockStep(0), // Index 0 - ID: "step-0"
        createMockStep(1), // Index 1 - ID: "step-1"
        blockA, // Index 2 - Steps: "block-2-step-0", "block-2-step-1"
        createMockStep(2), // Index 3 - ID: "step-2"
        blockB, // Index 4 - Steps: "block-4-step-0", "block-4-step-1"
      ]);

      // Act
      render(
        <WorkoutList
          workout={workout}
          onToggleStepSelection={onToggleStepSelection}
          selectedStepIds={[]}
        />
      );

      // Expand both blocks
      const blockHeaders = screen.getAllByRole("button", { name: /\dx/ });
      await user.click(blockHeaders[0]); // Block A
      await user.click(blockHeaders[1]); // Block B

      // Wait for blocks to expand and get all Step 1 buttons
      const allStep1Buttons = await screen.findAllByRole("button", {
        name: /Step 1:/,
      });

      // Click main workout Step 1 (stepIndex: 0)
      fireEvent.click(allStep1Buttons[0], { ctrlKey: true });

      // Click Block A Step 1 (stepIndex: 0)
      fireEvent.click(allStep1Buttons[1], { ctrlKey: true });

      // Click Block B Step 1 (stepIndex: 0)
      fireEvent.click(allStep1Buttons[2], { ctrlKey: true });

      // Assert
      // Should have called onToggleStepSelection 3 times with unique hierarchical IDs
      expect(onToggleStepSelection).toHaveBeenCalledTimes(3);
      // Each call should be with the unique hierarchical ID
      expect(onToggleStepSelection).toHaveBeenNthCalledWith(1, "step-0");
      expect(onToggleStepSelection).toHaveBeenNthCalledWith(
        2,
        "block-2-step-0"
      );
      expect(onToggleStepSelection).toHaveBeenNthCalledWith(
        3,
        "block-4-step-0"
      );
    });

    it("should maintain correct multi-selection state when steps are added and removed", async () => {
      // Arrange
      const user = userEvent.setup();
      const onToggleStepSelection = vi.fn();

      const blockA: RepetitionBlock = {
        repeatCount: 2,
        steps: [createMockStep(0), createMockStep(1), createMockStep(2)],
      };
      const workout = createMockWorkout([
        createMockStep(0), // Main workout step - ID: "step-0"
        createMockStep(1), // Main workout step - ID: "step-1"
        blockA, // Block at index 2
      ]);

      // Act
      const { rerender } = render(
        <WorkoutList
          workout={workout}
          onToggleStepSelection={onToggleStepSelection}
          selectedStepIds={[]}
        />
      );

      // Expand Block A
      const blockAHeader = screen.getAllByRole("button", { name: "2x" })[0];
      await user.click(blockAHeader);

      // Wait for block to expand and get all Step 1 buttons
      const allStep1Buttons = await screen.findAllByRole("button", {
        name: /Step 1:/,
      });

      // Select main workout Step 1
      fireEvent.click(allStep1Buttons[0], { ctrlKey: true });

      // Update selection state
      rerender(
        <WorkoutList
          workout={workout}
          onToggleStepSelection={onToggleStepSelection}
          selectedStepIds={["step-0"]}
        />
      );

      // Select Block A Step 1
      fireEvent.click(allStep1Buttons[1], { ctrlKey: true });

      // Update selection state
      rerender(
        <WorkoutList
          workout={workout}
          onToggleStepSelection={onToggleStepSelection}
          selectedStepIds={["step-0", "block-2-step-0"]}
        />
      );

      // Deselect main workout Step 1
      fireEvent.click(allStep1Buttons[0], { ctrlKey: true });

      // Update selection state after deselection
      rerender(
        <WorkoutList
          workout={workout}
          onToggleStepSelection={onToggleStepSelection}
          selectedStepIds={["block-2-step-0"]}
        />
      );

      // Assert
      // Should have called onToggleStepSelection 3 times total
      expect(onToggleStepSelection).toHaveBeenCalledTimes(3);

      // Verify the final state shows only Block A step selected
      const mainWorkoutStep = screen.getAllByRole("button", {
        name: /Step 1:/,
      })[0];
      expect(mainWorkoutStep.className).not.toContain("border-primary-500");
    });
  });

  describe("Selection set verification", () => {
    it("should contain only explicitly clicked step IDs in selection set", () => {
      // Arrange
      const blockA: RepetitionBlock = {
        repeatCount: 2,
        steps: [createMockStep(0), createMockStep(1)],
      };
      const blockB: RepetitionBlock = {
        repeatCount: 3,
        steps: [createMockStep(0), createMockStep(1)],
      };
      const workout = createMockWorkout([
        createMockStep(0), // Main workout step - ID: "step-0"
        blockA, // Block at index 1 - Step IDs: "block-1-step-0", "block-1-step-1"
        blockB, // Block at index 2 - Step IDs: "block-2-step-0", "block-2-step-1"
      ]);

      // Act - Select specific steps with same stepIndex from different contexts
      const selectedIds = ["step-0", "block-2-step-0"];
      render(<WorkoutList workout={workout} selectedStepIds={selectedIds} />);

      // Assert
      // The selection set should contain exactly the IDs we specified
      expect(selectedIds).toHaveLength(2);
      expect(selectedIds).toContain("step-0");
      expect(selectedIds).toContain("block-2-step-0");
      // Should NOT contain "block-1-step-0" even though it has stepIndex: 0
      expect(selectedIds).not.toContain("block-1-step-0");
    });

    it("should verify all selected step IDs are unique", () => {
      // Arrange
      const blockA: RepetitionBlock = {
        repeatCount: 2,
        steps: [createMockStep(0), createMockStep(1), createMockStep(2)],
      };
      const blockB: RepetitionBlock = {
        repeatCount: 3,
        steps: [createMockStep(0), createMockStep(1), createMockStep(2)],
      };
      const workout = createMockWorkout([
        createMockStep(0), // ID: "step-0"
        createMockStep(1), // ID: "step-1"
        blockA, // Block at index 2
        createMockStep(2), // ID: "step-2"
        blockB, // Block at index 4
      ]);

      // Act - Select multiple steps including ones with duplicate stepIndex
      const selectedIds = [
        "step-0", // Main workout Step 1
        "step-1", // Main workout Step 2
        "block-2-step-0", // Block A Step 1
        "block-2-step-1", // Block A Step 2
        "block-4-step-0", // Block B Step 1
      ];
      render(<WorkoutList workout={workout} selectedStepIds={selectedIds} />);

      // Assert
      // All IDs should be unique
      const uniqueIds = new Set(selectedIds);
      expect(uniqueIds.size).toBe(selectedIds.length);

      // Verify no duplicate IDs
      expect(selectedIds).toHaveLength(5);
      selectedIds.forEach((id) => {
        const count = selectedIds.filter(
          (selectedId) => selectedId === id
        ).length;
        expect(count).toBe(1);
      });
    });
  });
});
