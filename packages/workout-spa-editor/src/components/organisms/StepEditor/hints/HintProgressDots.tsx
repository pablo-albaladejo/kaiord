/**
 * HintProgressDots Component
 *
 * Progress indicator dots for hint rotation.
 */

import { useTranslate } from "../../../../i18n/use-translate";
import { HINTS } from "./constants";

type HintProgressDotsProps = {
  currentIndex: number;
};

export function HintProgressDots({ currentIndex }: HintProgressDotsProps) {
  const t = useTranslate("editor");
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
          aria-label={
            index === currentIndex
              ? t("firstTimeHints.progressDotCurrent", {
                  n: index + 1,
                  total: HINTS.length,
                })
              : t("firstTimeHints.progressDot", {
                  n: index + 1,
                  total: HINTS.length,
                })
          }
        />
      ))}
    </div>
  );
}
