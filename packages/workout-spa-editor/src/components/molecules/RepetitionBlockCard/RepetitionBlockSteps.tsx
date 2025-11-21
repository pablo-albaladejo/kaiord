/* eslint-disable max-lines, max-lines-per-function */
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus } from "lucide-react";
import type { WorkoutStep } from "../../../types/krd";
import { Button } from "../../atoms/Button/Button";
import { Icon } from "../../atoms/Icon/Icon";
import { StepCard } from "../StepCard/StepCard";

type RepetitionBlockStepsProps = {
  steps: WorkoutStep[];
  selectedStepIndex?: number;
  selectedStepIds?: readonly string[];
  onSelectStep?: (stepId: string) => void;
  onToggleStepSelection?: (stepId: string) => void;
  onRemoveStep?: (index: number) => void;
  onDuplicateStep?: (index: number) => void;
  onAddStep?: () => void;
  onReorderSteps?: (activeIndex: number, overIndex: number) => void;
  blockIndex?: number;
};

type SortableStepProps = {
  step: WorkoutStep;
  id: string;
  isSelected: boolean;
  isMultiSelected: boolean;
  onSelect?: () => void;
  onToggleMultiSelect?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
};

const SortableStep = ({
  step,
  id,
  isSelected,
  isMultiSelected,
  onSelect,
  onToggleMultiSelect,
  onDelete,
  onDuplicate,
}: SortableStepProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Remove role="button" from attributes to avoid conflict with StepCard's button role
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { role, ...restAttributes } = attributes;

  return (
    <div ref={setNodeRef} style={style} {...restAttributes}>
      <StepCard
        step={step}
        isSelected={isSelected}
        isMultiSelected={isMultiSelected}
        onSelect={onSelect}
        onToggleMultiSelect={onToggleMultiSelect}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        isDragging={isDragging}
        dragHandleProps={listeners}
      />
    </div>
  );
};

export const RepetitionBlockSteps = ({
  steps,
  selectedStepIndex,
  selectedStepIds = [],
  onSelectStep,
  onToggleStepSelection,
  onRemoveStep,
  onDuplicateStep,
  onAddStep,
  onReorderSteps,
  blockIndex,
}: RepetitionBlockStepsProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Generate unique IDs for steps within the block using hierarchical format
  // Format: "block-{blockIndex}-step-{stepIndex}"
  const sortableIds = steps.map((step) =>
    blockIndex !== undefined
      ? `block-${blockIndex}-step-${step.stepIndex}`
      : `block-step-${step.stepIndex}`
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !onReorderSteps) {
      return;
    }

    const activeIndex = sortableIds.indexOf(active.id as string);
    const overIndex = sortableIds.indexOf(over.id as string);

    if (activeIndex !== -1 && overIndex !== -1) {
      onReorderSteps(activeIndex, overIndex);
    }
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
          {steps.map((step, index) => {
            const stepId = sortableIds[index];
            const isMultiSelected = selectedStepIds.includes(stepId);
            return (
              <SortableStep
                key={stepId}
                id={stepId}
                step={step}
                isSelected={selectedStepIndex === index}
                isMultiSelected={isMultiSelected}
                onSelect={() => onSelectStep?.(stepId)}
                onToggleMultiSelect={() => onToggleStepSelection?.(stepId)}
                onDelete={onRemoveStep ? () => onRemoveStep(index) : undefined}
                onDuplicate={
                  onDuplicateStep ? () => onDuplicateStep(index) : undefined
                }
              />
            );
          })}
        </SortableContext>
      </DndContext>

      {onAddStep && (
        <Button
          variant="ghost"
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
