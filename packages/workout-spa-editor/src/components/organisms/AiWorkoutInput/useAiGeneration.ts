import type { Sport } from "@kaiord/core";
import { useCallback } from "react";

import { useAnalytics } from "../../../contexts";
import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useLatestRef } from "../../../hooks/use-latest-ref";
import { generateWorkoutKrd } from "../../../lib/generate-workout";
import { useAiStore } from "../../../store/ai-store";
import { useLoadWorkout } from "../../../store/workout-store-selectors";
import type { SportKey } from "../../../types/sport-zones";
import { formatZonesContext } from "./zones-formatter";

export const useAiGeneration = () => {
  const { getSelectedProvider, customPrompt, setGeneration } = useAiStore();
  // useLiveQuery returns `undefined` while loading; treat as no-profile.
  // Latest-ref so the LLM-call closure reads the freshest profile at call
  // time without rebuilding the closure on every profile mutation (which
  // would cancel in-flight generation).
  const profileRef = useLatestRef(useActiveProfileLive()?.profile ?? null);
  const loadWorkout = useLoadWorkout();
  const analytics = useAnalytics();

  const generate = useCallback(
    async (text: string, sport?: Sport) => {
      const provider = getSelectedProvider();
      if (!provider) return;

      setGeneration({ status: "loading" });

      try {
        const profile = profileRef.current;
        const sportKey = (sport || undefined) as SportKey | undefined;
        const zonesContext = profile
          ? formatZonesContext(profile, sportKey)
          : undefined;

        const krd = await generateWorkoutKrd({
          text,
          provider,
          sport,
          customPrompt: customPrompt || undefined,
          zonesContext,
        });

        loadWorkout(krd);
        setGeneration({ status: "success" });
        analytics.event("workout-generated", {
          provider: provider.id,
          sport: sport ?? "",
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Generation failed";
        setGeneration({ status: "error", message });
      }
    },
    [
      getSelectedProvider,
      customPrompt,
      setGeneration,
      profileRef,
      loadWorkout,
      analytics,
    ]
  );

  return { generate };
};
