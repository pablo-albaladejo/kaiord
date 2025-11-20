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
 * Generates a stable ID for a workout step based on its stepIndex
 * The stepIndex gets updated after reorder, which forces React to recreate the DOM elements
 * This ensures correct reconciliation during drag-and-drop operations
 */
const generateStepId = (
  step: WorkoutStep | RepetitionBlock,
  index: number
): string => {
  if (isWorkoutStep(step)) {
    // Use stepIndex which gets reindexed after reorder
    // This makes the ID change when content moves, forcing React to recreate elements
    return `step-${step.stepIndex}`;
  }

  // For repetition blocks, use array index
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
