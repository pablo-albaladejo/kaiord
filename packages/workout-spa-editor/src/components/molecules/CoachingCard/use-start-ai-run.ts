import { useCallback } from "react";
import { useLocation } from "wouter";

import { useAnalytics } from "../../../contexts/analytics-context";
import { useToastContext } from "../../../contexts/ToastContext";
import { useAiModelBindingsLive } from "../../../hooks/use-ai-model-bindings-live";
import { useAiProvidersLive } from "../../../hooks/use-ai-providers-live";
import { useGenerationDeps } from "../../../hooks/use-generation-deps";
import { useModelName } from "../../../hooks/use-model-name";
import { useTranslate } from "../../../i18n/use-translate";
import type { CoachingActivity } from "../../../types/coaching-activity";
import type { StartAiCtx } from "./start-ai-ctx";
import { runStartAi } from "./use-coaching-ai-handler-helpers";

export type AiRunSlots = Pick<
  StartAiCtx,
  "abortRef" | "setFailure" | "setProgress"
>;

/**
 * One AI run of the coaching dialog: `false` builds the Workout (or re-uses
 * it), `true` regenerates it in place. The failure toast is a static string
 * (R-PIIInterpolation).
 */
export const useStartAiRun = (
  activity: CoachingActivity | null,
  profileId: string | null,
  onClose: () => void,
  expandActivity: (activity: CoachingActivity) => void,
  { abortRef, setFailure, setProgress }: AiRunSlots
) => {
  const deps = useGenerationDeps();
  const analytics = useAnalytics();
  const toast = useToastContext();
  const t = useTranslate("coaching");
  const nameModel = useModelName();
  const providers = useAiProvidersLive();
  const bindings = useAiModelBindingsLive(profileId);
  const [, navigate] = useLocation();
  return useCallback(
    (regenerate: boolean) =>
      runStartAi({
        regenerate,
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
      }),
    [
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
      abortRef,
      setFailure,
      setProgress,
    ]
  );
};
