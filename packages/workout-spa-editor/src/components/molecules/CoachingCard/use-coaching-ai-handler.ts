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

import { useAnalytics } from "../../../contexts/analytics-context";
import { useToastContext } from "../../../contexts/ToastContext";
import { useAiModelBindingsLive } from "../../../hooks/use-ai-model-bindings-live";
import { useAiProvidersLive } from "../../../hooks/use-ai-providers-live";
import { useGenerationDeps } from "../../../hooks/use-generation-deps";
import { useModelName } from "../../../hooks/use-model-name";
import { useTranslate } from "../../../i18n/use-translate";
import type { CoachingActivity } from "../../../types/coaching-activity";
import { type AiRunProgress, cancelAiRun } from "./ai-run-progress";
import { runStartAi, type StartAiCtx } from "./use-coaching-ai-handler-helpers";
import type { AiFailureState, UseCoachingAi } from "./use-coaching-ai-types";

export const useCoachingAi = (
  activity: CoachingActivity | null,
  profileId: string | null,
  onClose: () => void,
  expandActivity: (activity: CoachingActivity) => void
): UseCoachingAi => {
  const deps = useGenerationDeps();
  const analytics = useAnalytics();
  const toast = useToastContext();
  const t = useTranslate("coaching");
  const nameModel = useModelName();
  const providers = useAiProvidersLive();
  const bindings = useAiModelBindingsLive(profileId);
  const [, navigate] = useLocation();
  const [progress, setProgress] = useState<AiRunProgress | null>(null);
  const [failure, setFailure] = useState<AiFailureState | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const startAi = useCallback(async () => {
    const ctx: StartAiCtx = {
      activity,
      profileId,
      expandActivity,
      providers,
      bindings,
      deps,
      analytics,
      abortRef,
      setFailure,
      setProgress,
      onClose,
      navigate,
      onFailureToast: () => toast.error(t("hooks.aiProcessFailed")),
      nameModel,
    };
    await runStartAi(ctx);
  }, [
    t,
    nameModel,
    activity,
    profileId,
    providers,
    bindings,
    deps,
    analytics,
    toast,
    onClose,
    navigate,
    expandActivity,
  ]);

  return {
    processing: progress !== null,
    progress,
    failure,
    clearFailure: useCallback(() => setFailure(null), []),
    startAi,
    cancelAi: useCallback(() => cancelAiRun({ abortRef, setProgress }), []),
  };
};
