import {
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useState } from "react";

import type { RepetitionBlock, Workout, WorkoutStep } from "../../../types/krd";
import { isWorkoutStep } from "../../../types/krd";

/**
 * Returns the item's stable `ItemId`.
 *
 * In production every `UIWorkout` item already carries an `id` (assigned
 * by `hydrateUIWorkout` on load, preserved through every mutation), so
 * the returned string is the same stable id the focus / selection
 * subsystem uses.
 *
 * The positional-ID fallback (`step-${stepIndex}` / `block-${index}` /
 * `block-${parentBlockIndex}-step-${stepIndex}`) is retained exclusively
 * for isolated component unit tests that construct raw `Workout` shapes
 * without going through `loadWorkout`. A CI grep invariant ensures no
 * production module relies on the positional path.
 */
const generateStepId = (
  item: WorkoutStep | RepetitionBlock,
  index?: number,
  parentBlockIndex?: number
): string => {
  const id = (item as { id?: string }).id;
  if (id) return id;

  if (isWorkoutStep(item)) {
    if (parentBlockIndex !== undefined) {
      return `block-${parentBlockIndex}-step-${item.stepIndex}`;
    }
    return `step-${item.stepIndex}`;
  }
  return `block-${index ?? 0}`;
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

  // Sortable IDs prefer the items' own stable ItemIds and fall back to
  // position-based ids only in test harnesses that skip `loadWorkout`.
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
