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

// ============================================
// Types
// ============================================

export type FirstTimeHintsProps = {
  storageKey?: string;
  onDismiss?: () => void;
};

// ============================================
// Constants
// ============================================

const DEFAULT_STORAGE_KEY = "workout-spa-first-workout-hints-dismissed";

const HINTS = [
  {
    id: "duration",
    title: "Set Duration",
    message:
      "Choose how long this step should last - by time, distance, or open-ended.",
  },
  {
    id: "target",
    title: "Set Target",
    message:
      "Define your training intensity using power, heart rate, pace, or cadence zones.",
  },
  {
    id: "save",
    title: "Save Your Step",
    message:
      "Click Save to add this step to your workout. You can edit it anytime.",
  },
];

// ============================================
// Component
// ============================================

export const FirstTimeHints: React.FC<FirstTimeHintsProps> = ({
  storageKey = DEFAULT_STORAGE_KEY,
  onDismiss,
}) => {
  const [visible, setVisible] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);

  // Check if hints should be shown
  useEffect(() => {
    const shouldShow = !hasCompletedFirstWorkout(storageKey);
    setVisible(shouldShow);
  }, [storageKey]);

  // Handle dismiss
  const handleDismiss = () => {
    saveCompletionState(storageKey);
    setVisible(false);
    onDismiss?.();
  };

  // Cycle through hints
  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      setCurrentHintIndex((prev) => (prev + 1) % HINTS.length);
    }, 5000); // Change hint every 5 seconds

    return () => clearInterval(interval);
  }, [visible]);

  if (!visible) return null;

  const currentHint = HINTS[currentHintIndex];

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

      {/* Progress dots */}
      <div className="mt-3 flex items-center justify-center gap-2">
        {HINTS.map((hint, index) => (
          <div
            key={hint.id}
            className={`h-2 w-2 rounded-full transition-colors ${
              index === currentHintIndex
                ? "bg-primary-600 dark:bg-primary-400"
                : "bg-primary-300 dark:bg-primary-700"
            }`}
            aria-label={`Hint ${index + 1} of ${HINTS.length}${index === currentHintIndex ? " (current)" : ""}`}
          />
        ))}
      </div>
    </div>
  );
};

// ============================================
// Utility Functions
// ============================================

/**
 * Check if user has completed their first workout
 */
export const hasCompletedFirstWorkout = (
  storageKey: string = DEFAULT_STORAGE_KEY
): boolean => {
  try {
    return localStorage.getItem(storageKey) === "true";
  } catch {
    return false;
  }
};

/**
 * Save completion state to localStorage
 */
const saveCompletionState = (storageKey: string): void => {
  try {
    localStorage.setItem(storageKey, "true");
  } catch (error) {
    console.error("Failed to save first workout completion state:", error);
  }
};

/**
 * Reset first workout completion state (for testing)
 */
export const resetFirstWorkoutState = (
  storageKey: string = DEFAULT_STORAGE_KEY
): void => {
  try {
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error("Failed to reset first workout state:", error);
  }
};
