/**
 * HintProgressDots Component
 *
 * Progress indicator dots for hint rotation.
 */

import { HINTS } from "./constants";

type HintProgressDotsProps = {
  currentIndex: number;
};

export function HintProgressDots({ currentIndex }: HintProgressDotsProps) {
  return (
    <div className="mt-3 flex items-center justify-center gap-2">
      {HINTS.map((hint, index) => (
        <div
          key={hint.id}
          className={`h-2 w-2 rounded-full transition-colors ${
            index === currentIndex
              ? "bg-primary-600 dark:bg-primary-400"
              : "bg-primary-300 dark:bg-primary-700"
          }`}
          aria-label={`Hint ${index + 1} of ${HINTS.length}${index === currentIndex ? " (current)" : ""}`}
        />
      ))}
    </div>
  );
}
