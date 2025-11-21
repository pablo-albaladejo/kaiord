import {
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useState } from "react";
import type { RepetitionBlock, Workout, WorkoutStep } from "../../../types/krd";
import { isWorkoutStep } from "../../../types/krd";

/**
 * Generates a globally unique ID for a workout item
 *
 * ID Format:
 * - Main workout step: `step-{stepIndex}`
 * - Step inside block: `block-{blockIndex}-step-{stepIndex}`
 * - Repetition block: `block-{index}`
 *
 * @param item - The workout step or repetition block
 * @param index - The item's position in the parent container
 * @param parentBlockIndex - Optional parent block index for nested steps
 * @returns A unique identifier string
 *
 * @example
 * // Main workout step
 * generateStepId(step, 0) // "step-1"
 *
 * @example
 * // Step inside repetition block at index 2
 * generateStepId(step, 0, 2) // "block-2-step-1"
 *
 * @example
 * // Repetition block
 * generateStepId(block, 2) // "block-2"
 */
const generateStepId = (
  item: WorkoutStep | RepetitionBlock,
  index: number,
  parentBlockIndex?: number
): string => {
  if (isWorkoutStep(item)) {
    // Steps in main workout: "step-{stepIndex}"
    // Steps in blocks: "block-{blockIndex}-step-{stepIndex}"
    if (parentBlockIndex !== undefined) {
      return `block-${parentBlockIndex}-step-${item.stepIndex}`;
    }
    return `step-${item.stepIndex}`;
  }

  // Repetition blocks: "block-{index}"
  return `block-${index}`;
};

/**
 * Hook for managing drag-and-drop functionality in WorkoutList
 * Configures sensors and handles drag events
 * Requirement 3: Enable drag-and-drop functionality for workout steps
 */
export const useWorkoutListDnd = (
  workout: Workout,
  onStepReorder?: (activeIndex: number, overIndex: number) => void
) => {
  // Track active drag item for DragOverlay
  const [activeId, setActiveId] = useState<string | null>(null);

  // Configure sensors for drag interactions
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Generate sortable IDs for all items using position-based IDs
  // This ensures React can correctly track element identity during reordering
  const sortableIds = workout.steps.map((item, index) =>
    generateStepId(item, index)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Clear active ID
    setActiveId(null);

    if (!over || active.id === over.id || !onStepReorder) {
      return;
    }

    const activeIndex = sortableIds.indexOf(active.id as string);
    const overIndex = sortableIds.indexOf(over.id as string);

    if (activeIndex !== -1 && overIndex !== -1) {
      onStepReorder(activeIndex, overIndex);
    }
  };

  // Get the active item for DragOverlay
  const activeItem = activeId
    ? workout.steps[sortableIds.indexOf(activeId)]
    : null;

  return {
    sensors,
    sortableIds,
    activeId,
    activeItem,
    handleDragStart,
    handleDragEnd,
    collisionDetection: closestCenter,
    generateStepId, // Export the function so components can use it
  };
};
