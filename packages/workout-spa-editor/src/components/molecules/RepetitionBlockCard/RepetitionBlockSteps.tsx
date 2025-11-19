import { Plus } from "lucide-react";
import type { WorkoutStep } from "../../../types/krd";
import { Button } from "../../atoms/Button/Button";
import { Icon } from "../../atoms/Icon/Icon";
import { StepCard } from "../StepCard/StepCard";

type RepetitionBlockStepsProps = {
  steps: WorkoutStep[];
  selectedStepIndex?: number;
  onSelectStep?: (index: number) => void;
  onRemoveStep?: (index: number) => void;
  onAddStep?: () => void;
};

export const RepetitionBlockSteps = ({
  steps,
  selectedStepIndex,
  onSelectStep,
  onRemoveStep,
  onAddStep,
}: RepetitionBlockStepsProps) => {
  return (
    <div className="space-y-2 ml-6">
      {steps.map((step, index) => (
        <div key={index} className="relative">
          <StepCard
            step={step}
            isSelected={selectedStepIndex === index}
            onSelect={() => onSelectStep?.(index)}
            onDelete={onRemoveStep ? () => onRemoveStep(index) : undefined}
          />
        </div>
      ))}

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
