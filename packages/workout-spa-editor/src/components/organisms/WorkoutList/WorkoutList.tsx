import { DndContext, DragOverlay } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { dndAnnouncements } from "./dnd-announcements";
import { useWorkoutListDnd } from "./use-workout-list-dnd";
import type { WorkoutListProps } from "./WorkoutList.types";
import { WorkoutListContent } from "./WorkoutListContent";
import { WorkoutListDragOverlay } from "./WorkoutListDragOverlay";

export type { WorkoutListProps };

export const WorkoutList = ({
  workout,
  selectedStepId,
  selectedStepIds = [],
  onStepSelect,
  onToggleStepSelection,
  onStepDelete,
  onStepDuplicate,
  onStepCopy,
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
  const dnd = useWorkoutListDnd(workout, onStepReorder);

  return (
    <DndContext
      sensors={dnd.sensors}
      collisionDetection={dnd.collisionDetection}
      onDragStart={dnd.handleDragStart}
      onDragEnd={dnd.handleDragEnd}
      accessibility={{ announcements: dndAnnouncements }}
    >
      <SortableContext
        items={dnd.sortableIds}
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
            onStepCopy={onStepCopy}
            onDuplicateStepInRepetitionBlock={onDuplicateStepInRepetitionBlock}
            onEditRepetitionBlock={onEditRepetitionBlock}
            onAddStepToRepetitionBlock={onAddStepToRepetitionBlock}
            onReorderStepsInBlock={onReorderStepsInBlock}
            generateStepId={dnd.generateStepId}
          />
        </div>
      </SortableContext>
      <DragOverlay>
        <WorkoutListDragOverlay activeItem={dnd.activeItem} />
      </DragOverlay>
    </DndContext>
  );
};
