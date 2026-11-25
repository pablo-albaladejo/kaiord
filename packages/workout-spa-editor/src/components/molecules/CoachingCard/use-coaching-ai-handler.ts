/**
 * AI-process handler for the coaching dialog (per design D2/D3).
 *
 * On failure the handler surfaces a typed reason so the dialog renders
 * the inline error state AND fires a single static toast (Amendment
 * C2 — R-PIIInterpolation: the message MUST be a bare string literal
 * or a top-level SCREAMING_SNAKE_CASE constant referring to one).
 * In-flight `AbortController` doubles as the re-entry lock, for a build
 * and for a Regenerate alike.
 */
import { useCallback, useRef, useState } from "react";

import type { CoachingActivity } from "../../../types/coaching-activity";
import { type AiRunProgress, cancelAiRun } from "./ai-run-progress";
import type { AiFailureState, UseCoachingAi } from "./use-coaching-ai-types";
import { useStartAiRun } from "./use-start-ai-run";

export const useCoachingAi = (
  activity: CoachingActivity | null,
  profileId: string | null,
  onClose: () => void,
  expandActivity: (activity: CoachingActivity) => void
): UseCoachingAi => {
  const [progress, setProgress] = useState<AiRunProgress | null>(null);
  const [failure, setFailure] = useState<AiFailureState | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const run = useStartAiRun(activity, profileId, onClose, expandActivity, {
    abortRef,
    setFailure,
    setProgress,
  });

  return {
    processing: progress !== null,
    progress,
    failure,
    clearFailure: useCallback(() => setFailure(null), []),
    startAi: useCallback(() => run(false), [run]),
    regenerateAi: useCallback(() => run(true), [run]),
    cancelAi: useCallback(() => cancelAiRun({ abortRef, setProgress }), []),
  };
};
