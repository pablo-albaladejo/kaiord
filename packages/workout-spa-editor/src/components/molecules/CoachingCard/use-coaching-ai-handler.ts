/**
 * AI-process handler for the coaching dialog (per design D2/D3).
 *
 * On failure the handler surfaces a typed reason so the dialog renders
 * the inline error state AND fires a single static toast (Amendment
 * C2 — R-PIIInterpolation: the message MUST be a bare string literal
 * or a top-level SCREAMING_SNAKE_CASE constant referring to one).
 * In-flight `AbortController` doubles as the re-entry lock.
 */
import { useCallback, useRef, useState } from "react";
import { useLocation } from "wouter";

import type { AiFailureReason } from "../../../application/coaching/convert-coaching-activity-error-mapper";
import { useAnalytics } from "../../../contexts/analytics-context";
import { usePersistence } from "../../../contexts/persistence-context";
import { useToastContext } from "../../../contexts/ToastContext";
import { useAiModelBindingsLive } from "../../../hooks/use-ai-model-bindings-live";
import { useAiProvidersLive } from "../../../hooks/use-ai-providers-live";
import type { CoachingActivity } from "../../../types/coaching-activity";
import { runStartAi, type StartAiCtx } from "./use-coaching-ai-handler-helpers";

const AI_PROCESS_ERROR_TOAST_MESSAGE = "Failed to process activity with AI";

export type AiFailureState = {
  reason: AiFailureReason | "not-found" | "no-provider";
  error?: string;
};

export type UseCoachingAi = {
  processing: boolean;
  failure: AiFailureState | null;
  clearFailure: () => void;
  startAi: () => Promise<void>;
  cancelAi: () => void;
};

export const useCoachingAi = (
  activity: CoachingActivity | null,
  profileId: string | null,
  onClose: () => void
): UseCoachingAi => {
  const persistence = usePersistence();
  const analytics = useAnalytics();
  const toast = useToastContext();
  const providers = useAiProvidersLive();
  const bindings = useAiModelBindingsLive(profileId);
  const [, navigate] = useLocation();
  const [processing, setProcessing] = useState(false);
  const [failure, setFailure] = useState<AiFailureState | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const startAi = useCallback(async () => {
    const ctx: StartAiCtx = {
      activity,
      profileId,
      providers,
      bindings,
      persistence,
      analytics,
      abortRef,
      setFailure,
      setProcessing,
      onClose,
      navigate,
      onFailureToast: () => toast.error(AI_PROCESS_ERROR_TOAST_MESSAGE),
    };
    await runStartAi(ctx);
  }, [
    activity,
    profileId,
    providers,
    bindings,
    persistence,
    analytics,
    toast,
    onClose,
    navigate,
  ]);

  return {
    processing,
    failure,
    clearFailure: useCallback(() => setFailure(null), []),
    startAi,
    cancelAi: useCallback(() => {
      abortRef.current?.abort();
      abortRef.current = null;
      setProcessing(false);
    }, []),
  };
};
