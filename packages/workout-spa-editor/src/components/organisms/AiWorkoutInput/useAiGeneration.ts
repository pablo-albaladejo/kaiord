import type { Sport } from "@kaiord/core";
import { useCallback } from "react";

import { useAnalytics } from "../../../contexts";
import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useAiCustomPromptLive } from "../../../hooks/use-ai-custom-prompt-live";
import { useAiProvidersLive } from "../../../hooks/use-ai-providers-live";
import { useLatestRef } from "../../../hooks/use-latest-ref";
import { useAiRuntimeStore } from "../../../store/ai-runtime-store";
import type { LlmProviderConfig } from "../../../store/ai-store-types";
import { useLoadWorkout } from "../../../store/workout-store-selectors";
import { runAiGeneration } from "./run-ai-generation";
import { useAiFallbackEffect } from "./use-ai-fallback-effect";

const resolveProvider = (
  providers: LlmProviderConfig[] | undefined,
  selectedId: string | null
): LlmProviderConfig | null => {
  if (!providers) return null;
  return (
    providers.find((p) => p.id === selectedId) ??
    providers.find((p) => p.isDefault) ??
    null
  );
};

export const useAiGeneration = () => {
  const providers = useAiProvidersLive();
  const customPrompt = useAiCustomPromptLive();
  const selectedProviderId = useAiRuntimeStore((s) => s.selectedProviderId);
  const selectForGeneration = useAiRuntimeStore((s) => s.selectForGeneration);
  const setGeneration = useAiRuntimeStore((s) => s.setGeneration);

  useAiFallbackEffect(providers, selectedProviderId, selectForGeneration);

  // Latest-ref so the LLM-call closure reads the freshest provider /
  // profile / prompt at call time without rebuilding the closure on
  // every mutation (which would cancel in-flight generation).
  const profileRef = useLatestRef(useActiveProfileLive()?.profile ?? null);
  const providersRef = useLatestRef(providers);
  const customPromptRef = useLatestRef(customPrompt);
  const loadWorkout = useLoadWorkout();
  const analytics = useAnalytics();

  const generate = useCallback(
    async (text: string, sport?: Sport) => {
      const provider = resolveProvider(
        providersRef.current,
        selectedProviderId
      );
      if (!provider) return;
      await runAiGeneration({
        text,
        sport,
        provider,
        profile: profileRef.current,
        customPrompt: customPromptRef.current ?? null,
        setGeneration,
        loadWorkout,
        analytics,
      });
    },
    [
      providersRef,
      selectedProviderId,
      customPromptRef,
      setGeneration,
      profileRef,
      loadWorkout,
      analytics,
    ]
  );

  return { generate };
};
