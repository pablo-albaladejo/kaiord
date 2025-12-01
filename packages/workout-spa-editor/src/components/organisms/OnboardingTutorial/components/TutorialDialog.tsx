/**
 * TutorialDialog Component
 *
 * Main dialog content for tutorial.
 */

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { TutorialStep } from "../types";
import { getPositionClasses } from "../utils/position-utils";
import { TutorialActions } from "./TutorialActions";
import { TutorialProgress } from "./TutorialProgress";

type TutorialDialogProps = {
  step: TutorialStep;
  currentStep: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSkip: () => void;
};

export function TutorialDialog({
  step,
  currentStep,
  totalSteps,
  isFirstStep,
  isLastStep,
  onPrevious,
  onNext,
  onSkip,
}: TutorialDialogProps) {
  return (
    <Dialog.Content
      className={`fixed z-50 w-full max-w-md border border-gray-200 bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg dark:border-gray-700 dark:bg-gray-800 kiroween:border-gray-700 kiroween:bg-gray-800 ${getPositionClasses(step.position)}`}
      aria-describedby="tutorial-description"
    >
      <div className="flex items-center justify-between mb-4">
        <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white kiroween:text-white">
          {step.title}
        </Dialog.Title>
        <button
          onClick={onSkip}
          className="rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:pointer-events-none dark:ring-offset-gray-950"
          aria-label="Skip tutorial"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <Dialog.Description
        id="tutorial-description"
        className="text-sm text-gray-600 dark:text-gray-400 mb-6"
      >
        {step.description}
      </Dialog.Description>

      <TutorialProgress currentStep={currentStep} totalSteps={totalSteps} />

      <TutorialActions
        isFirstStep={isFirstStep}
        isLastStep={isLastStep}
        onPrevious={onPrevious}
        onNext={onNext}
        onSkip={onSkip}
      />
    </Dialog.Content>
  );
}
