import {
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type { RepetitionBlock, Workout, WorkoutStep } from "../../../types/krd";
import { isWorkoutStep } from "../../../types/krd";

/**
 * Generates a stable ID for a workout step based on its content
 * This ensures the ID doesn't change when the step is reordered
 */
const generateStepId = (
  step: WorkoutStep | RepetitionBlock,
  index: number
): string => {
  if (isWorkoutStep(step)) {
    // Use a combination of properties that uniquely identify the step
    // Format: step-{durationType}-{targetType}-{index}
    return `step-${step.durationType}-${step.targetType}-${index}`;
  }
  // For repetition blocks, use the repeat count and index
  return `block-${step.repeatCount}-${index}`;
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

  // Generate sortable IDs for all items using content-based IDs
  // This ensures IDs are stable even when steps are reordered
  const sortableIds = workout.steps.map((item, index) =>
    generateStepId(item, index)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !onStepReorder) {
      return;
    }

    const activeIndex = sortableIds.indexOf(active.id as string);
    const overIndex = sortableIds.indexOf(over.id as string);

    if (activeIndex !== -1 && overIndex !== -1) {
      onStepReorder(activeIndex, overIndex);
    }
  };

  return {
    sensors,
    sortableIds,
    handleDragEnd,
    collisionDetection: closestCenter,
    generateStepId, // Export the function so components can use it
  };
};
