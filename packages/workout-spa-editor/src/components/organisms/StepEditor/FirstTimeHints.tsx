/**
 * FirstTimeHints Component
 *
 * Inline hints for first-time users during workout creation.
 *
 * Requirements:
 * - Requirement 37.3: Show hints during workout creation for first-time users
 */

import { Info, X } from "lucide-react";
import { useEffect, useState } from "react";
import { DEFAULT_STORAGE_KEY } from "./hints/constants";
import { HintProgressDots } from "./hints/HintProgressDots";
import {
  hasCompletedFirstWorkout,
  resetFirstWorkoutState,
  saveCompletionState,
} from "./hints/storage-utils";
import { useHintRotation } from "./hints/useHintRotation";

export type FirstTimeHintsProps = {
  storageKey?: string;
  onDismiss?: () => void;
};

export const FirstTimeHints: React.FC<FirstTimeHintsProps> = ({
  storageKey = DEFAULT_STORAGE_KEY,
  onDismiss,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const shouldShow = !hasCompletedFirstWorkout(storageKey);
    setVisible(shouldShow);
  }, [storageKey]);

  const { currentHintIndex, currentHint } = useHintRotation(visible);

  const handleDismiss = () => {
    saveCompletionState(storageKey);
    setVisible(false);
    onDismiss?.();
  };

  if (!visible) return null;

  return (
    <div
      className="mb-4 rounded-lg border border-primary-200 bg-primary-50 p-4 dark:border-primary-800 dark:bg-primary-950"
      role="status"
      aria-live="polite"
      data-testid="first-time-hints"
    >
      <div className="flex items-start gap-3">
        <Info
          className="h-5 w-5 flex-shrink-0 text-primary-600 dark:text-primary-400"
          aria-hidden="true"
        />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-primary-900 dark:text-primary-100">
            {currentHint.title}
          </h3>
          <p className="mt-1 text-sm text-primary-700 dark:text-primary-300">
            {currentHint.message}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:pointer-events-none dark:ring-offset-gray-950"
          aria-label="Dismiss hints"
        >
          <X className="h-4 w-4 text-primary-600 dark:text-primary-400" />
        </button>
      </div>

      <HintProgressDots currentIndex={currentHintIndex} />
    </div>
  );
};

// Re-export utilities for testing
export { hasCompletedFirstWorkout, resetFirstWorkoutState };
