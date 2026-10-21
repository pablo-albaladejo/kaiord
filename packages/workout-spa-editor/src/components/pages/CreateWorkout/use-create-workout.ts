import {
  isModelNotFoundError,
  resolveModelForPurpose,
} from "@kaiord/ai/providers";
import type { KRD } from "@kaiord/core";
import { useCallback, useState } from "react";
import { useSearch } from "wouter";

import { useToastContext } from "../../../contexts/ToastContext";
import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useAiCustomPromptLive } from "../../../hooks/use-ai-custom-prompt-live";
import { useAiModelBindingsLive } from "../../../hooks/use-ai-model-bindings-live";
import { useAiProvidersLive } from "../../../hooks/use-ai-providers-live";
import { useTranslate } from "../../../i18n/use-translate";
import type { ActiveSport } from "../../../lib/athlete";
import { ATHLETE_SPORTS } from "../../../lib/athlete";
import { generateWorkoutKrd } from "../../../lib/generate-workout";

export type CreatePhase = "input" | "generating" | "result";

export function useCreateWorkout() {
  const [phase, setPhase] = useState<CreatePhase>("input");
  const [promptText, setPromptText] = useState("");
  const [sport, setSport] = useState<ActiveSport>(ATHLETE_SPORTS[0]!.value);
  const [generatedKrd, setGeneratedKrd] = useState<KRD | null>(null);

  const active = useActiveProfileLive();
  const providers = useAiProvidersLive();
  const bindings = useAiModelBindingsLive(active?.id ?? null);
  const customPrompt = useAiCustomPromptLive();
  const toast = useToastContext();
  const t = useTranslate("create-workout");
  const search = useSearch();
  const dateParam = new URLSearchParams(search).get("date");

  const resolved = resolveModelForPurpose(
    "workout_generation",
    providers ?? [],
    bindings ?? []
  );
  const provider = resolved?.provider ?? null;

  const generate = useCallback(async () => {
    if (!promptText.trim() || !resolved) return;
    setPhase("generating");
    try {
      // Still loading (undefined): let generation read them from the db.
      const athlete =
        active === undefined || customPrompt === undefined
          ? undefined
          : { profile: active.profile, customPrompt };
      const krd = await generateWorkoutKrd({
        text: promptText,
        provider: resolved.provider,
        modelId: resolved.modelId,
        sport,
        athlete,
      });
      setGeneratedKrd(krd);
      setPhase("result");
    } catch (error) {
      setPhase("input");
      if (isModelNotFoundError(error)) toast.error(t("toast.modelUnavailable"));
      else toast.error(t("toast.generationFailed"));
    }
  }, [promptText, resolved, active, sport, customPrompt, toast, t]);

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
