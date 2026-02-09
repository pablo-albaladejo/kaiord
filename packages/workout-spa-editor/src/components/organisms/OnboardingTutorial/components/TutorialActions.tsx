/**
 * TutorialActions Component
 *
 * Navigation buttons for tutorial.
 */

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../../atoms/Button/Button";

type TutorialActionsProps = {
  isFirstStep: boolean;
  isLastStep: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSkip: () => void;
};

export function TutorialActions({
  isFirstStep,
  isLastStep,
  onPrevious,
  onNext,
  onSkip,
}: TutorialActionsProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Button variant="secondary" onClick={onSkip} size="sm">
        Skip
      </Button>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={onPrevious}
          disabled={isFirstStep}
          size="sm"
          aria-label="Previous"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button onClick={onNext} size="sm">
          {isLastStep ? "Finish" : "Next"}
          {!isLastStep && <ChevronRight className="ml-1 h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
