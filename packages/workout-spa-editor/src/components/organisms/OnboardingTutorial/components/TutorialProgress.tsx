/**
 * TutorialProgress Component
 *
 * Progress indicator for tutorial steps.
 */

type TutorialProgressProps = {
  currentStep: number;
  totalSteps: number;
};

export function TutorialProgress({
  currentStep,
  totalSteps,
}: TutorialProgressProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Step {currentStep + 1} of {totalSteps}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="h-2 rounded-full bg-primary-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={currentStep + 1}
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          aria-label={`Tutorial progress: step ${currentStep + 1} of ${totalSteps}`}
        />
      </div>
    </div>
  );
}
