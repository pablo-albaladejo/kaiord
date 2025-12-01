/**
 * OnboardingTutorial Component
 *
 * Step-by-step tutorial overlay for first-time users.
 *
 * Requirements:
 * - Requirement 37.1: Display onboarding tutorial on first visit
 * - Requirement 37.5: Allow skipping or replaying tutorial
 */

import * as Dialog from "@radix-ui/react-dialog";
import { TutorialDialog } from "./components/TutorialDialog";
import { TutorialOverlay } from "./components/TutorialOverlay";
import { useElementHighlight } from "./hooks/useElementHighlight";
import { useTutorialNavigation } from "./hooks/useTutorialNavigation";
import type { OnboardingTutorialProps } from "./types";
import { DEFAULT_STORAGE_KEY } from "./utils/storage-utils";

export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({
  steps,
  open,
  onOpenChange,
  onComplete,
  storageKey = DEFAULT_STORAGE_KEY,
}) => {
  const {
    currentStep,
    isFirstStep,
    isLastStep,
    handleNext,
    handlePrevious,
    handleSkip,
  } = useTutorialNavigation({
    stepsCount: steps.length,
    storageKey,
    onOpenChange,
    onComplete,
  });

  const step = steps[currentStep];
  const highlightedElement = useElementHighlight(open, step?.targetSelector);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={document.body}>
        <TutorialOverlay highlightedElement={highlightedElement} />
        <TutorialDialog
          step={step}
          currentStep={currentStep}
          totalSteps={steps.length}
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onSkip={handleSkip}
        />
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export type { OnboardingTutorialProps, TutorialStep } from "./types";
export { hasCompletedOnboarding, resetOnboarding } from "./utils/storage-utils";
