import type { HTMLAttributes } from "react";
import type { RepetitionBlock, Workout, WorkoutStep } from "../../../types/krd";
import { isRepetitionBlock } from "../../../types/krd";
import { StepCard } from "../../molecules/StepCard/StepCard";

export type WorkoutListProps = HTMLAttributes<HTMLDivElement> & {
  workout: Workout;
  selectedStepId?: string | null;
  onStepSelect?: (stepIndex: number) => void;
};

type RenderStepProps = {
  step: WorkoutStep;
  selectedStepId?: string | null;
  onStepSelect?: (stepIndex: number) => void;
};

const renderStep = ({
  step,
  selectedStepId,
  onStepSelect,
}: RenderStepProps) => {
  const isSelected = selectedStepId === `step-${step.stepIndex}`;

  return (
    <StepCard
      key={`step-${step.stepIndex}`}
      step={step}
      isSelected={isSelected}
      onSelect={onStepSelect ? () => onStepSelect(step.stepIndex) : undefined}
    />
  );
};

type RenderRepetitionBlockProps = {
  block: RepetitionBlock;
  blockIndex: number;
  selectedStepId?: string | null;
  onStepSelect?: (stepIndex: number) => void;
};

const renderRepetitionBlock = ({
  block,
  blockIndex,
  selectedStepId,
  onStepSelect,
}: RenderRepetitionBlockProps) => {
  return (
    <div
      key={`block-${blockIndex}`}
      className="border-2 border-dashed border-primary-300 dark:border-primary-700 rounded-lg p-4 bg-primary-50/30 dark:bg-primary-900/10"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
          Repeat {block.repeatCount}x
        </span>
      </div>

      <div className="flex flex-col gap-3 pl-4 border-l-4 border-primary-300 dark:border-primary-700">
        {block.steps.map((step) =>
          renderStep({ step, selectedStepId, onStepSelect })
        )}
      </div>
    </div>
  );
};

export const WorkoutList = ({
  workout,
  selectedStepId,
  onStepSelect,
  className = "",
  ...props
}: WorkoutListProps) => {
  const baseClasses = "flex flex-col gap-4";
  const classes = [baseClasses, className].filter(Boolean).join(" ");

  return (
    <div className={classes} role="list" aria-label="Workout steps" {...props}>
      {workout.steps.map((item, index) => {
        if (isRepetitionBlock(item)) {
          return renderRepetitionBlock({
            block: item,
            blockIndex: index,
            selectedStepId,
            onStepSelect,
          });
        }
        return renderStep({ step: item, selectedStepId, onStepSelect });
      })}
    </div>
  );
};
