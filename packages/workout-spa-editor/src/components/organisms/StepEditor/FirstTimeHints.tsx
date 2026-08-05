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

import { useTranslate } from "../../../i18n/use-translate";
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
  const t = useTranslate("editor");

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
      className="mb-4 rounded-xl border border-edge-soft bg-surface-elevated p-4"
      role="status"
      aria-live="polite"
      data-testid="first-time-hints"
    >
      <div className="flex items-start gap-3">
        <Info
          className="h-5 w-5 flex-shrink-0 text-ink-muted"
          aria-hidden="true"
        />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-ink-strong">
            {currentHint && t(`firstTimeHints.${currentHint.id}.title`)}
          </h3>
          <p className="mt-1 text-sm text-ink-body">
            {currentHint && t(`firstTimeHints.${currentHint.id}.message`)}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:ring-offset-2 focus:ring-offset-[var(--bg-elevated)] disabled:pointer-events-none motion-reduce:transition-none"
          aria-label={t("firstTimeHints.dismiss")}
        >
          <X className="h-4 w-4 text-ink-muted" />
        </button>
      </div>

      <HintProgressDots currentIndex={currentHintIndex} />
    </div>
  );
};

export { hasCompletedFirstWorkout, resetFirstWorkoutState };
