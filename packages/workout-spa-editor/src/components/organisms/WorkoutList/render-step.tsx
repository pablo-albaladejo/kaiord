import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { WorkoutStep } from "../../../types/krd";
import { StepCard } from "../../molecules/StepCard/StepCard";

type RenderStepProps = {
  readonly step: WorkoutStep;
  readonly index: number;
  readonly selectedStepId?: string | null;
  readonly selectedStepIds?: readonly string[];
  readonly onStepSelect?: (stepIndex: number) => void;
  readonly onToggleStepSelection?: (stepIndex: number) => void;
  readonly onStepDelete?: (stepIndex: number) => void;
  readonly onStepDuplicate?: (stepIndex: number) => void;
};

export const renderStep = ({
  step,
  index,
  selectedStepId,
  selectedStepIds = [],
  onStepSelect,
  onToggleStepSelection,
  onStepDelete,
  onStepDuplicate,
}: RenderStepProps) => {
  // Use array index for ID to match sortableIds in use-workout-list-dnd
  const stepId = `step-${index}`;
  const isSelected = selectedStepId === stepId;
  const isMultiSelected = selectedStepIds.includes(stepId);

  return (
    <SortableStepCard
      key={stepId}
      id={stepId}
      step={step}
      isSelected={isSelected}
      isMultiSelected={isMultiSelected}
      onSelect={onStepSelect ? () => onStepSelect(step.stepIndex) : undefined}
      onToggleMultiSelect={
        onToggleStepSelection
          ? () => onToggleStepSelection(step.stepIndex)
          : undefined
      }
      onDelete={onStepDelete ? () => onStepDelete(step.stepIndex) : undefined}
      onDuplicate={
        onStepDuplicate ? () => onStepDuplicate(step.stepIndex) : undefined
      }
    />
  );
};

type SortableStepCardProps = {
  id: string;
  step: WorkoutStep;
  isSelected: boolean;
  isMultiSelected: boolean;
  onSelect?: () => void;
  onToggleMultiSelect?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
};

const SortableStepCard = ({
  id,
  step,
  isSelected,
  isMultiSelected,
  onSelect,
  onToggleMultiSelect,
  onDelete,
  onDuplicate,
}: SortableStepCardProps) => {
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
