import type { KRD } from "@kaiord/core";
import { useCallback, useState } from "react";
import { useSearch } from "wouter";

import { useToastContext } from "../../../contexts/ToastContext";
import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useAiCustomPromptLive } from "../../../hooks/use-ai-custom-prompt-live";
import { useAiProvidersLive } from "../../../hooks/use-ai-providers-live";
import type { ActiveSport } from "../../../lib/athlete";
import { ATHLETE_SPORTS } from "../../../lib/athlete";
import { generateWorkoutKrd } from "../../../lib/generate-workout";
import type { LlmProviderConfig } from "../../../store/ai-store-types";
import { formatZonesContext } from "../../organisms/AiWorkoutInput/zones-formatter";

export type CreatePhase = "input" | "generating" | "result";

const GENERATION_FAILED = "Workout generation failed";

const pickProvider = (
  providers: LlmProviderConfig[] | undefined
): LlmProviderConfig | null => {
  if (!providers || providers.length === 0) return null;
  return providers.find((p) => p.isDefault) ?? providers[0] ?? null;
};

export function useCreateWorkout() {
  const [phase, setPhase] = useState<CreatePhase>("input");
  const [promptText, setPromptText] = useState("");
  const [sport, setSport] = useState<ActiveSport>(ATHLETE_SPORTS[0]!.value);
  const [generatedKrd, setGeneratedKrd] = useState<KRD | null>(null);

  const active = useActiveProfileLive();
  const providers = useAiProvidersLive();
  const customPrompt = useAiCustomPromptLive();
  const toast = useToastContext();
  const search = useSearch();
  const dateParam = new URLSearchParams(search).get("date");

  const provider = pickProvider(providers);

  const generate = useCallback(async () => {
    if (!promptText.trim() || !provider) return;
    setPhase("generating");
    try {
      const profile = active?.profile ?? null;
      const zonesContext = profile
        ? formatZonesContext(profile, sport)
        : undefined;
      const krd = await generateWorkoutKrd({
        text: promptText,
        provider,
        sport,
        customPrompt: customPrompt ?? undefined,
        zonesContext,
      });
      setGeneratedKrd(krd);
      setPhase("result");
    } catch {
      setPhase("input");
      toast.error(GENERATION_FAILED);
    }
  }, [promptText, provider, active, sport, customPrompt, toast]);

  return {
    phase,
    setPhase,
    promptText,
    setPromptText,
    sport,
    setSport,
    generatedKrd,
    provider,
    profile: active?.profile ?? null,
    activeProfileId: active?.id ?? null,
    dateParam,
    generate,
  };
}
