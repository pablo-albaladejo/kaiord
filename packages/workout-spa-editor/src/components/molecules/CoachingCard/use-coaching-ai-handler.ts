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
import { useTranslate } from "../../../i18n/use-translate";
import type { CoachingActivity } from "../../../types/coaching-activity";
import { runStartAi, type StartAiCtx } from "./use-coaching-ai-handler-helpers";

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
  onClose: () => void,
  expandActivity: (activity: CoachingActivity) => void
): UseCoachingAi => {
  const persistence = usePersistence();
  const analytics = useAnalytics();
  const toast = useToastContext();
  const t = useTranslate("coaching");
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
      expandActivity,
      providers,
      bindings,
      persistence,
      analytics,
      abortRef,
      setFailure,
      setProcessing,
      onClose,
      navigate,
      onFailureToast: () => toast.error(t("hooks.aiProcessFailed")),
    };
    await runStartAi(ctx);
  }, [
    t,
    activity,
    profileId,
    providers,
    bindings,
    persistence,
    analytics,
    toast,
    onClose,
    navigate,
    expandActivity,
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
