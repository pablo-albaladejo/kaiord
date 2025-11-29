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
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../atoms/Button/Button";

// ============================================
// Types
// ============================================

export type TutorialStep = {
  title: string;
  description: string;
  targetSelector?: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
};

export type OnboardingTutorialProps = {
  steps: Array<TutorialStep>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
  storageKey?: string;
};

// ============================================
// Constants
// ============================================

const DEFAULT_STORAGE_KEY = "workout-spa-onboarding-completed";

// ============================================
// Component
// ============================================

export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({
  steps,
  open,
  onOpenChange,
  onComplete,
  storageKey = DEFAULT_STORAGE_KEY,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] =
    useState<HTMLElement | null>(null);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const step = steps[currentStep];

  // Highlight target element
  useEffect(() => {
    if (!open || !step?.targetSelector) {
      setHighlightedElement(null);
      return;
    }

    const element = document.querySelector<HTMLElement>(step.targetSelector);
    if (element) {
      setHighlightedElement(element);
      // scrollIntoView may not be available in test environments
      if (typeof element.scrollIntoView === "function") {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    return () => {
      setHighlightedElement(null);
    };
  }, [open, step?.targetSelector]);

  // Handle next step
  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  // Handle skip
  const handleSkip = () => {
    saveCompletionState();
    onOpenChange(false);
    setCurrentStep(0);
  };

  // Handle complete
  const handleComplete = () => {
    saveCompletionState();
    onOpenChange(false);
    setCurrentStep(0);
    onComplete?.();
  };

  // Save completion state to localStorage
  const saveCompletionState = () => {
    try {
      localStorage.setItem(storageKey, "true");
    } catch (error) {
      console.error("Failed to save onboarding completion state:", error);
    }
  };

  // Get position classes for dialog
  const getPositionClasses = () => {
    if (!step?.position || step.position === "center") {
      return "left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]";
    }

    switch (step.position) {
      case "top":
        return "left-[50%] top-[10%] translate-x-[-50%]";
      case "bottom":
        return "left-[50%] bottom-[10%] translate-x-[-50%]";
      case "left":
        return "left-[10%] top-[50%] translate-y-[-50%]";
      case "right":
        return "right-[10%] top-[50%] translate-y-[-50%]";
      default:
        return "left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]";
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={document.body}>
        {/* Overlay with highlighted element */}
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
          {highlightedElement && (
            <div
              className="absolute rounded-lg ring-4 ring-primary-500 ring-offset-4 ring-offset-black/70 transition-all duration-300"
              style={{
                top: `${highlightedElement.offsetTop}px`,
                left: `${highlightedElement.offsetLeft}px`,
                width: `${highlightedElement.offsetWidth}px`,
                height: `${highlightedElement.offsetHeight}px`,
              }}
              aria-hidden="true"
            />
          )}
        </Dialog.Overlay>

        {/* Tutorial Dialog */}
        <Dialog.Content
          className={`fixed z-50 w-full max-w-md border border-gray-200 bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg dark:border-gray-700 dark:bg-gray-800 kiroween:border-gray-700 kiroween:bg-gray-800 ${getPositionClasses()}`}
          aria-describedby="tutorial-description"
        >
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white kiroween:text-white">
              {step?.title}
            </Dialog.Title>
            <button
              onClick={handleSkip}
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
            {step?.description}
          </Dialog.Description>

          {/* Progress indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-2 rounded-full bg-primary-600 transition-all duration-300"
                style={{
                  width: `${((currentStep + 1) / steps.length) * 100}%`,
                }}
                role="progressbar"
                aria-valuenow={currentStep + 1}
                aria-valuemin={1}
                aria-valuemax={steps.length}
                aria-label={`Tutorial progress: step ${currentStep + 1} of ${steps.length}`}
              />
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between gap-2">
            <Button variant="secondary" onClick={handleSkip} className="flex-1">
              Skip Tutorial
            </Button>
            <div className="flex gap-2">
              {!isFirstStep && (
                <Button
                  variant="secondary"
                  onClick={handlePrevious}
                  aria-label="Previous step"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <Button
                onClick={handleNext}
                aria-label={isLastStep ? "Complete tutorial" : "Next step"}
              >
                {isLastStep ? "Complete" : <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

// ============================================
// Utility Functions
// ============================================

/**
 * Check if onboarding has been completed
 */
export const hasCompletedOnboarding = (
  storageKey: string = DEFAULT_STORAGE_KEY
): boolean => {
  try {
    return localStorage.getItem(storageKey) === "true";
  } catch {
    return false;
  }
};

/**
 * Reset onboarding completion state (for replay)
 */
export const resetOnboarding = (
  storageKey: string = DEFAULT_STORAGE_KEY
): void => {
  try {
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error("Failed to reset onboarding state:", error);
  }
};
