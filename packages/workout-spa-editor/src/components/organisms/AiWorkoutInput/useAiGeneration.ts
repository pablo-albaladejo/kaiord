import type { Sport } from "@kaiord/core";
import { useCallback } from "react";

import { resolveModelForPurpose } from "../../../application/ai/resolve-model-for-purpose";
import { useAnalytics } from "../../../contexts";
import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useAiCustomPromptLive } from "../../../hooks/use-ai-custom-prompt-live";
import { useAiModelBindingsLive } from "../../../hooks/use-ai-model-bindings-live";
import { useAiProvidersLive } from "../../../hooks/use-ai-providers-live";
import { useLatestRef } from "../../../hooks/use-latest-ref";
import { useActiveLocale } from "../../../i18n/LocaleProvider";
import { useAiRuntimeStore } from "../../../store/ai-runtime-store";
import { useLoadWorkout } from "../../../store/selectors";
import { runAiGeneration } from "./run-ai-generation";
import { useAiFallbackEffect } from "./use-ai-fallback-effect";

export const useAiGeneration = () => {
  const active = useActiveProfileLive();
  const providers = useAiProvidersLive();
  const bindings = useAiModelBindingsLive(active?.id ?? null);
  const customPrompt = useAiCustomPromptLive();
  const selectedProviderId = useAiRuntimeStore((s) => s.selectedProviderId);
  const selectForGeneration = useAiRuntimeStore((s) => s.selectForGeneration);
  const setGeneration = useAiRuntimeStore((s) => s.setGeneration);

  useAiFallbackEffect(providers, selectedProviderId, selectForGeneration);

  // Latest-ref so the LLM-call closure reads the freshest provider /
  // profile / prompt at call time without rebuilding the closure on
  // every mutation (which would cancel in-flight generation).
  const profileRef = useLatestRef(active?.profile ?? null);
  const providersRef = useLatestRef(providers);
  const bindingsRef = useLatestRef(bindings);
  const customPromptRef = useLatestRef(customPrompt);
  const localeRef = useLatestRef(useActiveLocale());
  const loadWorkout = useLoadWorkout();
  const analytics = useAnalytics();

  const generate = useCallback(
    async (text: string, sport?: Sport) => {
      const resolved = resolveModelForPurpose(
        "workout_generation",
        providersRef.current ?? [],
        bindingsRef.current ?? []
      );
      if (!resolved) return;
      await runAiGeneration({
        text,
        sport,
        provider: resolved.provider,
        modelId: resolved.modelId,
        profile: profileRef.current,
        customPrompt: customPromptRef.current ?? null,
        locale: localeRef.current,
        setGeneration,
        loadWorkout,
        analytics,
      });
    },
    [
      providersRef,
      bindingsRef,
      customPromptRef,
      localeRef,
      setGeneration,
      profileRef,
      loadWorkout,
      analytics,
    ]
  );

  return { generate };
};
