/**
 * useTutorialNavigation Hook
 *
 * Tutorial navigation logic.
 */

import { useState } from "react";

type UseTutorialNavigationParams = {
  stepsCount: number;
  storageKey: string;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
};

export function useTutorialNavigation(params: UseTutorialNavigationParams) {
  const { stepsCount, storageKey, onOpenChange, onComplete } = params;
  const [currentStep, setCurrentStep] = useState(0);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === stepsCount - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, stepsCount - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSkip = () => {
    saveCompletionState();
    onOpenChange(false);
    setCurrentStep(0);
  };

  const handleComplete = () => {
    saveCompletionState();
    onOpenChange(false);
    setCurrentStep(0);
    onComplete?.();
  };

  const saveCompletionState = () => {
    try {
      localStorage.setItem(storageKey, "true");
    } catch (error) {
      console.error("Failed to save onboarding completion state:", error);
    }
  };

  return {
    currentStep,
    isFirstStep,
    isLastStep,
    handleNext,
    handlePrevious,
    handleSkip,
  };
}
