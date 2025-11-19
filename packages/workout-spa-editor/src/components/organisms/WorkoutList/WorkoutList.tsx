import { DndContext } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { HTMLAttributes } from "react";
import type { Workout } from "../../../types/krd";
import { dndAnnouncements } from "./dnd-announcements";
import { useWorkoutListDnd } from "./use-workout-list-dnd";
import { WorkoutListContent } from "./WorkoutListContent";

export type WorkoutListProps = HTMLAttributes<HTMLDivElement> & {
  workout: Workout;
  selectedStepId?: string | null;
  selectedStepIds?: readonly string[];
  onStepSelect?: (stepIndex: number) => void;
  onToggleStepSelection?: (stepIndex: number) => void;
  onStepDelete?: (stepIndex: number) => void;
  onStepDuplicate?: (stepIndex: number) => void;
  onDuplicateStepInRepetitionBlock?: (
    blockIndex: number,
    stepIndex: number
  ) => void;
  onEditRepetitionBlock?: (blockIndex: number, repeatCount: number) => void;
  onAddStepToRepetitionBlock?: (blockIndex: number) => void;
  onStepReorder?: (activeIndex: number, overIndex: number) => void;
  onReorderStepsInBlock?: (
    blockIndex: number,
    activeIndex: number,
    overIndex: number
  ) => void;
};

export const WorkoutList = ({
  workout,
  selectedStepId,
  selectedStepIds = [],
  onStepSelect,
  onToggleStepSelection,
  onStepDelete,
  onStepDuplicate,
  onDuplicateStepInRepetitionBlock,
  onEditRepetitionBlock,
  onAddStepToRepetitionBlock,
  onStepReorder,
  onReorderStepsInBlock,
  className = "",
  ...props
}: WorkoutListProps) => {
  const baseClasses = "flex flex-col gap-4";
  const classes = [baseClasses, className].filter(Boolean).join(" ");

  const { sensors, sortableIds, handleDragEnd, collisionDetection } =
    useWorkoutListDnd(workout, onStepReorder);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragEnd={handleDragEnd}
      accessibility={{ announcements: dndAnnouncements }}
    >
      <SortableContext
        items={sortableIds}
        strategy={verticalListSortingStrategy}
      >
        <div
          className={classes}
          role="list"
          aria-label="Workout steps"
          {...props}
        >
          <WorkoutListContent
            workout={workout}
            selectedStepId={selectedStepId}
            selectedStepIds={selectedStepIds}
            onStepSelect={onStepSelect}
            onToggleStepSelection={onToggleStepSelection}
            onStepDelete={onStepDelete}
            onStepDuplicate={onStepDuplicate}
            onDuplicateStepInRepetitionBlock={onDuplicateStepInRepetitionBlock}
            onEditRepetitionBlock={onEditRepetitionBlock}
            onAddStepToRepetitionBlock={onAddStepToRepetitionBlock}
            onReorderStepsInBlock={onReorderStepsInBlock}
          />
        </div>
      </SortableContext>
    </DndContext>
  );
};
