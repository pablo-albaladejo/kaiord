import {
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type { Workout } from "../../../types/krd";
import { isRepetitionBlock } from "../../../types/krd";

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

  // Generate sortable IDs for all items using array index
  // This ensures IDs match the actual position in the array
  const sortableIds = workout.steps.map((item, index) => {
    if (isRepetitionBlock(item)) {
      return `block-${index}`;
    }
    return `step-${index}`;
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    console.log("🔍 handleDragEnd called", {
      activeId: active.id,
      overId: over?.id,
      hasCallback: !!onStepReorder,
    });

    if (!over || active.id === over.id || !onStepReorder) {
      console.log("❌ Early return:", {
        noOver: !over,
        sameId: active.id === over?.id,
        noCallback: !onStepReorder,
      });
      return;
    }

    const activeIndex = sortableIds.indexOf(active.id as string);
    const overIndex = sortableIds.indexOf(over.id as string);

    console.log("📊 Indices:", {
      activeIndex,
      overIndex,
      sortableIds,
    });

    if (activeIndex !== -1 && overIndex !== -1) {
      console.log("✅ Calling onStepReorder", { activeIndex, overIndex });
      onStepReorder(activeIndex, overIndex);
    }
  };

  return {
    sensors,
    sortableIds,
    handleDragEnd,
    collisionDetection: closestCenter,
  };
};
