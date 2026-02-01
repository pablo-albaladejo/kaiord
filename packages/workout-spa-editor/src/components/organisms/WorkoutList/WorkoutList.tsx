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

export const WorkoutList = (props: WorkoutListProps) => {
  const { workout, className = "", onStepReorder } = props;

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
        <div className={classes} role="list" aria-label="Workout steps">
          <WorkoutListContent
            workout={workout}
            selectedStepId={props.selectedStepId}
            selectedStepIds={props.selectedStepIds || []}
            onStepSelect={props.onStepSelect}
            onToggleStepSelection={props.onToggleStepSelection}
            onStepDelete={props.onStepDelete}
            onStepDuplicate={props.onStepDuplicate}
            onStepCopy={props.onStepCopy}
            onDuplicateStepInRepetitionBlock={
              props.onDuplicateStepInRepetitionBlock
            }
            onEditRepetitionBlock={props.onEditRepetitionBlock}
            onAddStepToRepetitionBlock={props.onAddStepToRepetitionBlock}
            onUngroupRepetitionBlock={props.onUngroupRepetitionBlock}
            onDeleteRepetitionBlock={props.onDeleteRepetitionBlock}
            onReorderStepsInBlock={props.onReorderStepsInBlock}
            generateStepId={dnd.generateStepId}
            onAddStep={props.onAddStep}
          />
        </div>
      </SortableContext>
      <DragOverlay>
        <WorkoutListDragOverlay activeItem={dnd.activeItem} />
      </DragOverlay>
    </DndContext>
  );
};
