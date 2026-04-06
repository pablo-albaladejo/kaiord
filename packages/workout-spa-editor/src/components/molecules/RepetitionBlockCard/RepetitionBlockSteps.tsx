import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";

import { Button } from "../../atoms/Button/Button";
import { Icon } from "../../atoms/Icon/Icon";
import type { RepetitionBlockStepsProps } from "./repetition-block-steps.types";
import { buildSortableIds } from "./repetition-block-steps.types";
import { StepList } from "./StepList";

export const RepetitionBlockSteps = (props: RepetitionBlockStepsProps) => {
  const { steps, onReorderSteps, onAddStep, blockIndex } = props;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const sortableIds = buildSortableIds(steps, blockIndex);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorderSteps) return;
    const activeIdx = sortableIds.indexOf(active.id as string);
    const overIdx = sortableIds.indexOf(over.id as string);
    if (activeIdx !== -1 && overIdx !== -1) onReorderSteps(activeIdx, overIdx);
  };

  return (
    <div className="space-y-2 ml-6">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortableIds}
          strategy={verticalListSortingStrategy}
        >
          <StepList {...props} sortableIds={sortableIds} />
        </SortableContext>
      </DndContext>
      {onAddStep && (
        <Button
          variant="tertiary"
          size="sm"
          onClick={onAddStep}
          className="w-full"
          data-testid="add-step-button"
        >
          <Icon icon={Plus} size="sm" />
          Add Step
        </Button>
      )}
    </div>
  );
};
